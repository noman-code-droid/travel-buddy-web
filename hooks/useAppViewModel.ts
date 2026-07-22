import { useState, useEffect } from 'react';
import { AppState, UserMode, ActiveTab, SubView } from '@/types';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';

export function useAppViewModel() {
  const [user, loading, error] = useAuthState(auth);
  const [appState, setAppState] = useState<AppState>('splash');
  const [userMode, setUserMode] = useState<UserMode>('passenger');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [subView, setSubView] = useState<SubView>(null);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);

  // Trip Planner State
  const [plannerStep, setPlannerStep] = useState(1);
  const [plannerData, setPlannerData] = useState({
    destination: '',
    interests: [] as string[],
    duration: '',
  });

  // Handle Initial App Flow
  useEffect(() => {
    if (appState === 'splash') {
      const timer = setTimeout(() => {
        setAppState('onboarding');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [appState]);

  // Sync Firebase User with App State
  useEffect(() => {
    if (!loading) {
      if (user) {
        setAppState('main');
      } else if (appState === 'main') {
        setAppState('auth');
      }
    }
  }, [user, loading]);

  const handleAuthSuccess = () => setAppState('main');

  const handleLogout = async () => {
    await signOut(auth);
    setAppState('auth');
  };

  const handleSwitchMode = () => {
    setUserMode(prev => prev === 'passenger' ? 'driver' : 'passenger');
    setShowSwitchConfirm(false);
  };

  const navigateToSubView = (view: SubView) => {
    if (view === 'planner') {
      setPlannerStep(1);
    }
    setSubView(view);
  };

  const closeSubView = () => setSubView(null);
  const requestSwitchMode = () => setShowSwitchConfirm(true);
  const cancelSwitchMode = () => setShowSwitchConfirm(false);

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
    // Planner exports
    plannerStep,
    setPlannerStep,
    plannerData,
    setPlannerData
  };
}
