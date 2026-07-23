import { useState, useEffect } from 'react';
import { AppState, UserMode, ActiveTab, SubView } from '@/types';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export function useAppViewModel() {
  const [user, loading, error] = useAuthState(auth);
  const [appState, setAppState] = useState<AppState>('splash');
  const [userMode, setUserMode] = useState<UserMode>('passenger');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [subView, setSubView] = useState<SubView>(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);

  // Trusted Contacts State
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // 1. Splash Timer: Ensure splash shows for exactly 2.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // 2. Navigation Logic: Only move away from splash once timer is done AND auth status is known
  useEffect(() => {
    if (splashFinished && !loading) {
      if (user) {
        setAppState('main');
      } else {
        setAppState('onboarding');
      }
    }
  }, [splashFinished, loading, user]);

  // Handle manual logout
  const handleLogout = async () => {
    await signOut(auth);
    setAppState('auth');
  };

  // Real-time Contacts Listener
  useEffect(() => {
    if (!user) return;

    setLoadingContacts(true);
    const q = query(
      collection(db, "trusted_contacts"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContacts(contactList);
      setLoadingContacts(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAuthSuccess = () => setAppState('main');

  const handleSwitchMode = () => {
    setUserMode(prev => prev === 'passenger' ? 'driver' : 'passenger');
    setShowSwitchConfirm(false);
  };

  const navigateToSubView = (view: SubView) => setSubView(view);
  const closeSubView = () => setSubView(null);
  const requestSwitchMode = () => setShowSwitchConfirm(true);
  const cancelSwitchMode = () => setShowSwitchConfirm(false);

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
    handleSwitchMode,
    navigateToSubView,
    closeSubView,
    requestSwitchMode,
    cancelSwitchMode,
    // Contacts
    contacts,
    loadingContacts,
    addContact
  };
}
