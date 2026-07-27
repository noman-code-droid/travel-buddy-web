import { useState, useEffect, useCallback } from 'react';
import { AppState, UserMode, ActiveTab, SubView, UserStats, ActiveRideInfo, Notification, Chat } from '@/types';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, orderBy, limit, updateDoc, deleteDoc } from 'firebase/firestore';

export function useAppViewModel() {
  const [user, loading, error] = useAuthState(auth);
  const [appState, setAppState] = useState<AppState>('splash');
  const [userMode, setUserMode] = useState<UserMode>('passenger');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [subView, setSubView] = useState<SubView>(null);

  // Dialog & Menu States
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showPhotoConfirm, setShowPhotoConfirm] = useState(false);
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showPostOptionsMenu, setShowPostOptionsMenu] = useState(false);
  const [showProfilePicViewer, setShowProfilePicViewer] = useState(false);

  const [splashFinished, setSplashFinished] = useState(false);

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [completedRideData, setCompletedRideData] = useState<any>(null);
  const [ratingTarget, setRatingTarget] = useState<any>(null);
  const [photoViewerUrl, setPhotoViewerUrl] = useState('');

  // Map & Route States
  const [currentRouteDirections, setCurrentRouteDirections] = useState<any>(null);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<{lat: number, lng: number, address: string} | null>(null);

  const [stats, setStats] = useState<UserStats>({ trips: 0, savingsOrEarnings: 0, rating: '★ 5.0' });
  const [activeRide, setActiveRide] = useState<ActiveRideInfo | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [contentViewData, setContentViewData] = useState<{title: string, content?: string, faqs?: any[]} | null>(null);

  const checkProfileCompletion = useCallback(async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists() && userDoc.data().phone) {
        setAppState('main');
      } else {
        setAppState('complete_profile');
      }
    } catch (err) {
      setAppState('main');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setSplashFinished(true); }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!splashFinished || loading) return;
    if (user) {
      if (user.emailVerified) checkProfileCompletion(user.uid);
      else setAppState('email_verification');
    } else {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      setAppState(hasSeenOnboarding === 'true' ? 'auth' : 'onboarding');
    }
  }, [splashFinished, loading, user, checkProfileCompletion]);

  useEffect(() => {
    if (!user || (appState !== 'main' && appState !== 'complete_profile')) return;

    const unsubStats = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      setProfileData(data);
      if (userMode === 'driver') {
        setStats({ trips: data.driverTrips || 0, savingsOrEarnings: Math.floor(data.totalEarnings || 0), rating: `★ ${(data.driverRating || 5.0).toFixed(1)}` });
      } else {
        setStats({ trips: data.passengerTrips || 0, savingsOrEarnings: Math.floor(data.totalSavings || 0), rating: `★ ${(data.passengerRating || 5.0).toFixed(1)}` });
      }
    });

    const unsubNotif = onSnapshot(
      query(collection(db, "users", user.uid, "notifications"), orderBy("timestamp", "desc"), limit(20)),
      (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({
          title: doc.data().title || 'Update',
          desc: doc.data().description || '',
          time: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now',
          type: doc.data().type || 'info'
        } as Notification)));
        setUnreadNotifications(snapshot.docs.filter(d => d.data().isUnread).length);
      }
    );

    const unsubChats = onSnapshot(
      query(collection(db, "chats"), where("participants", "array-contains", user.uid)),
      (snapshot) => {
        let totalUnread = 0;
        setChats(snapshot.docs.map(doc => {
            const data = doc.data();
            const unread = data[`unreadCount_${user.uid}`] || 0;
            totalUnread += unread;
            return {
                id: doc.id,
                name: data.otherPartyName || 'Chat',
                otherUserId: data.participants.find((p: string) => p !== user.uid),
                lastMsg: data.lastMessage || '',
                time: data.lastMessageTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '',
                unread: unread,
                photoUrl: data.otherPartyPhoto || ''
            } as Chat;
        }));
        setUnreadChats(totalUnread);
      }
    );

    const unsubContacts = onSnapshot(query(collection(db, "trusted_contacts"), where("userId", "==", user.uid)), (snapshot) => {
      setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubStats(); unsubNotif(); unsubChats(); unsubContacts(); };
  }, [user, userMode, appState]);

  useEffect(() => {
    if (!user || appState !== 'main') return;
    let unsubActive: (() => void) | undefined;

    if (userMode === 'passenger') {
      unsubActive = onSnapshot(query(collection(db, "bookings"), where("passengerId", "==", user.uid)), (snapshot) => {
        const activeBooking = snapshot.docs.find(doc => ["active", "started", "picked up", "picked", "arrived"].includes((doc.data().status || '').toLowerCase().replace("_", " ")));
        if (activeBooking) {
          const data = activeBooking.data();
          setActiveRide({
            id: data.rideId, driverId: data.driverId, driverName: data.driverName || 'Driver', status: data.status,
            route: `${data.pickupLocation || ''} → ${data.dropOffLocation || ''}`, isDriver: false, driverPhoto: data.driverPhoto, vehicleSubtitle: data.vehicleSubtitle
          });
        } else {
          const lastComp = snapshot.docs.find(doc => doc.data().status === 'completed' && !doc.data().rated);
          if (lastComp && !subView && activeTab === 'home') { setCompletedRideData(lastComp.data()); setSubView('summary'); }
          setActiveRide(null);
        }
      });
    } else {
      unsubActive = onSnapshot(query(collection(db, "rides"), where("driverId", "==", user.uid)), (snapshot) => {
        const activeRideDoc = snapshot.docs.find(doc => ["active", "started"].includes((doc.data().status || '').toLowerCase()));
        if (activeRideDoc) {
          const data = activeRideDoc.data();
          setActiveRide({
            id: activeRideDoc.id, driverId: user.uid, driverName: 'Me (Driver)', status: data.status,
            route: `${data.pickupLocation} → ${data.dropOffLocation}`, isDriver: true, vehicleSubtitle: `${data.vehicleMake} ${data.vehicleModel}`
          });
        } else { setActiveRide(null); }
      });
    }
    return () => { if (unsubActive) unsubActive(); };
  }, [user, userMode, appState, activeTab, subView]);

  return {
    user, appState, userMode, activeTab, subView,
    showSwitchConfirm, showLogoutConfirm, showConsent, showRateDialog,
    showMediaPicker, showTimePicker, showPhotoConfirm, showAppealDialog,
    showChatMenu, showPostOptionsMenu, showProfilePicViewer,
    setShowMediaPicker, setShowPhotoConfirm, setShowAppealDialog, setShowChatMenu, setShowPostOptionsMenu, setShowProfilePicViewer,
    setActiveTab,
    handleAuthSuccess: () => {
        if (appState === 'onboarding') { localStorage.setItem('hasSeenOnboarding', 'true'); setAppState('auth'); }
        else if (user) checkProfileCompletion(user.uid);
    },
    handleLogout: async () => { await signOut(auth); setShowLogoutConfirm(false); setAppState('auth'); setActiveTab('home'); },
    handleSwitchMode: () => {
      if (userMode === 'passenger' && profileData?.verificationStatus !== 'approved') { setShowSwitchConfirm(false); setSubView('driver_reg'); return; }
      setUserMode(prev => prev === 'passenger' ? 'driver' : 'passenger'); setShowSwitchConfirm(false);
    },
    navigateToSubView: (view: SubView) => {
        if (view === 'post' && userMode !== 'driver') { setShowSwitchConfirm(true); return; }
        if (view === 'post' && profileData?.verificationStatus !== 'approved') { setSubView('driver_reg'); return; }
        setSubView(view);
    },
    closeSubView: () => setSubView(null),
    requestSwitchMode: () => setShowSwitchConfirm(true),
    cancelSwitchMode: () => setShowSwitchConfirm(false),
    requestLogout: () => setShowLogoutConfirm(true),
    cancelLogout: () => setShowLogoutConfirm(false),
    openAiAssistant: () => { setSubView(null); setActiveTab('explore'); },
    stats, activeRide, notifications, chats, unreadNotifications, unreadChats, contacts, loadingContacts, profileData,
    addContact: async (name: string, phone: string) => { if (user) await addDoc(collection(db, "trusted_contacts"), { userId: user.uid, name, phone, createdAt: serverTimestamp() }); },
    onProfileComplete: () => setAppState('main'),
    selectedChat, openChatDetail: (chat: Chat) => { setSelectedChat(chat); setSubView('chat_detail'); },
    selectedRideId, openRideDetails: (id: string) => { setSelectedRideId(id); setSubView('ride_details'); },
    selectedDriverId, openDriverProfile: (id: string) => { setSelectedDriverId(id); setSubView('driver_profile'); },
    completedRideData,
    ratingTarget,
    openRateDialog: (target: any) => { setRatingTarget(target); setShowRateDialog(true); },
    closeRateDialog: () => setShowRateDialog(false),
    submitRating: async (score: number) => setShowRateDialog(false),
    openForgetPassword: () => setAppState('forget_password'),
    openEmailVerification: () => setAppState('email_verification'),
    closeAuthFlow: () => setAppState('auth'),
    contentViewData,
    openContentView: (title: string, content?: string, faqs?: any[]) => setContentViewData({ title, content, faqs }),
    closeContentView: () => setContentViewData(null),
    openDriverManifest: () => { if (activeRide?.isDriver) setSubView('driver_manifest'); },
    openPickupSelector: (directions: any) => { setCurrentRouteDirections(directions); setSubView('pickup_selector'); },
    currentRouteDirections, setCurrentRouteDirections,
    selectedPickupLocation, setSelectedPickupLocation,
    exitChat: () => { setShowChatMenu(false); setSubView('chat_list'); },
    deletePost: async (postId: string) => { await deleteDoc(doc(db, "rides", postId)); setShowPostOptionsMenu(false); },
    submitAppeal: async (statement: string) => {
       if (!user) return;
       await updateDoc(doc(db, "users", user.uid), { appealStatement: statement, verificationStatus: 'pending' });
       setShowAppealDialog(false);
    },
    openPhotoViewer: (url: string) => { setPhotoViewerUrl(url); setShowProfilePicViewer(true); },
    photoViewerUrl
  };
}
