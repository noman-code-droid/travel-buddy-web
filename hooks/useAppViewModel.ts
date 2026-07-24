import { useState, useEffect } from 'react';
import { AppState, UserMode, ActiveTab, SubView, UserStats, ActiveRideInfo, Notification, Chat } from '@/types';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc, orderBy, limit } from 'firebase/firestore';

export function useAppViewModel() {
  const [user, loading, error] = useAuthState(auth);
  const [appState, setAppState] = useState<AppState>('splash');
  const [userMode, setUserMode] = useState<UserMode>('passenger');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [subView, setSubView] = useState<SubView>(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);

  // Selection States
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [completedRideData, setCompletedRideData] = useState<any>(null);

  // Stats & State (MainActivity.kt parity)
  const [stats, setStats] = useState<UserStats>({ trips: 0, savingsOrEarnings: 0, rating: '★ 5.0' });
  const [activeRide, setActiveRide] = useState<ActiveRideInfo | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  // Lists
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  // Badge counts
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);

  // Loading states
  const [loadingContacts, setLoadingContacts] = useState(false);

  // 1. Splash Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // 2. Navigation & Profile Logic (SplashActivity.kt parity)
  useEffect(() => {
    if (!splashFinished || loading) return;

    if (user) {
      const checkProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().phone) {
            setAppState('main');
          } else {
            setAppState('complete_profile');
          }
        } catch (err) {
          setAppState('main');
        }
      };
      checkProfile();
    } else {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (hasSeenOnboarding === 'true') {
        setAppState('auth');
      } else {
        setAppState('onboarding');
      }
    }
  }, [splashFinished, loading, user]);

  // 3. Main Data Listeners
  useEffect(() => {
    if (!user || (appState !== 'main' && appState !== 'complete_profile')) return;

    const unsubStats = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      setProfileData(data);

      if (userMode === 'driver') {
        setStats({
          trips: data.driverTrips || 0,
          savingsOrEarnings: Math.floor(data.totalEarnings || 0),
          rating: `★ ${(data.driverRating || 5.0).toFixed(1)}`
        });
      } else {
        setStats({
          trips: data.passengerTrips || 0,
          savingsOrEarnings: Math.floor(data.totalSavings || 0),
          rating: `★ ${(data.passengerRating || 5.0).toFixed(1)}`
        });
      }
    });

    const unsubNotif = onSnapshot(
      query(collection(db, "users", user.uid, "notifications"), orderBy("timestamp", "desc"), limit(20)),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          title: doc.data().title || 'Update',
          desc: doc.data().description || '',
          time: doc.data().timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now',
          type: doc.data().type || 'info'
        } as Notification));
        setNotifications(list);
        setUnreadNotifications(snapshot.docs.filter(d => d.data().isUnread).length);
      }
    );

    const unsubChats = onSnapshot(
      query(collection(db, "chats"), where("participants", "array-contains", user.uid)),
      (snapshot) => {
        let totalUnread = 0;
        const list = snapshot.docs.map(doc => {
            const data = doc.data();
            const unread = data[`unreadCount_${user.uid}`] || 0;
            totalUnread += unread;
            return {
                id: doc.id,
                name: data.otherPartyName || 'Chat',
                otherUserId: data.participants.find((p: string) => p !== user.uid),
                lastMsg: data.lastMessage || '',
                time: data.lastMessageTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '',
                unread: unread
            } as Chat;
        });
        setChats(list);
        setUnreadChats(totalUnread);
      }
    );

    const unsubContacts = onSnapshot(
      query(collection(db, "trusted_contacts"), where("userId", "==", user.uid)),
      (snapshot) => {
        setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      unsubStats(); unsubNotif(); unsubChats(); unsubContacts();
    };
  }, [user, userMode, appState]);

  // 4. Active Ride Listener (MainActivity.kt & TrackRideActivity.kt parity)
  useEffect(() => {
    if (!user || appState !== 'main') return;

    let unsubActive: (() => void) | undefined;

    if (userMode === 'passenger') {
      const q = query(collection(db, "bookings"), where("passengerId", "==", user.uid));
      unsubActive = onSnapshot(q, (snapshot) => {
        const activeBooking = snapshot.docs.find(doc => {
          const s = (doc.data().status || '').toLowerCase().replace("_", " ");
          return ["active", "started", "picked up", "picked", "arrived"].includes(s);
        });

        if (activeBooking) {
          const data = activeBooking.data();
          setActiveRide({
            id: data.rideId,
            driverId: data.driverId,
            driverName: data.driverName || 'Driver',
            status: data.status,
            route: `${data.pickupLocation || ''} → ${data.dropOffLocation || ''}`,
            isDriver: false,
            driverPhoto: data.driverPhoto,
            vehicleSubtitle: data.vehicleSubtitle
          });
        } else {
          // If no active, check if just completed (RideSummaryActivity logic)
          const lastCompleted = snapshot.docs.find(doc => doc.data().status === 'completed');
          if (lastCompleted && !subView && activeTab === 'home') {
             setCompletedRideData(lastCompleted.data());
             setSubView('summary');
          }
          setActiveRide(null);
        }
      });
    } else {
      const q = query(collection(db, "rides"), where("driverId", "==", user.uid));
      unsubActive = onSnapshot(q, (snapshot) => {
        const activeRideDoc = snapshot.docs.find(doc => {
          const s = (doc.data().status || '').toLowerCase();
          return s === "active" || s === "started";
        });

        if (activeRideDoc) {
          const data = activeRideDoc.data();
          setActiveRide({
            id: activeRideDoc.id,
            driverId: user.uid,
            driverName: 'Me (Driver)',
            status: data.status,
            route: `${data.pickupLocation} → ${data.dropOffLocation}`,
            isDriver: true,
            vehicleSubtitle: `${data.vehicleMake} ${data.vehicleModel}`
          });
        } else {
          setActiveRide(null);
        }
      });
    }

    return () => { if (unsubActive) unsubActive(); };
  }, [user, userMode, appState, activeTab, subView]);

  const handleLogout = async () => {
    await signOut(auth);
    setAppState('auth');
    setActiveTab('home');
  };

  const handleAuthSuccess = () => {
    if (appState === 'onboarding') {
      localStorage.setItem('hasSeenOnboarding', 'true');
      setAppState('auth');
    } else if (user) {
      checkProfileCompletion(user.uid);
    }
  };

  const navigateToSubView = (view: SubView) => {
    // Replicating checkModeAndPost logic from MainActivity.kt
    if (view === 'post' && userMode !== 'driver') {
        setShowSwitchConfirm(true);
        return;
    }
    if (view === 'post' && profileData?.verificationStatus !== 'approved') {
        setSubView('driver_reg');
        return;
    }
    setSubView(view);
  };

  const openChatDetail = (chat: Chat) => {
    setSelectedChat(chat);
    setSubView('chat_detail');
  };

  const openRideDetails = (id: string) => {
    setSelectedRideId(id);
    setSubView('ride_details');
  };

  const addContact = async (name: string, phone: string) => {
    if (!user) return;
    await addDoc(collection(db, "trusted_contacts"), {
      userId: user.uid,
      name,
      phone,
      createdAt: serverTimestamp()
    });
  };

  return {
    user,
    loadingAuth: loading,
    appState,
    userMode,
    activeTab,
    subView,
    showSwitchConfirm,
    setActiveTab,
    handleAuthSuccess,
    handleLogout,
    handleSwitchMode: () => { setUserMode(prev => prev === 'passenger' ? 'driver' : 'passenger'); setShowSwitchConfirm(false); },
    navigateToSubView,
    closeSubView: () => setSubView(null),
    requestSwitchMode: () => setShowSwitchConfirm(true),
    cancelSwitchMode: () => setShowSwitchConfirm(false),
    // Real-time Data
    stats,
    activeRide,
    notifications,
    chats,
    unreadNotifications,
    unreadChats,
    contacts,
    loadingContacts,
    addContact,
    profileData,
    onProfileComplete: () => setAppState('main'),
    // Selection
    selectedChat,
    openChatDetail,
    selectedRideId,
    openRideDetails,
    completedRideData
  };
}
