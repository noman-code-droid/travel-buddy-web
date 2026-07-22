'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// MVVM: Components (View)
import SplashView from '@/components/SplashView';
import OnboardingView from '@/components/OnboardingView';
import AuthView from '@/components/AuthView';
import HomeView from '@/components/HomeView';
import RidesView from '@/components/RidesView';
import ChatView from '@/components/ChatView';
import ProfileView from '@/components/ProfileView';
import BottomNav from '@/components/BottomNav';

// Sub-Views (Overlays)
import FindRideView from '@/components/FindRideView';
import PostRideView from '@/components/PostRideView';
import SafetyView from '@/components/SafetyView';
import NotificationsView from '@/components/NotificationsView';
import ChatListView from '@/components/ChatListView';
import PlannerView from '@/components/PlannerView';

// MVVM: ViewModel
import { useAppViewModel } from '@/hooks/useAppViewModel';

export default function AppContainer() {
  const {
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
    // Real-time Contacts Data
    contacts,
    loadingContacts,
    addContact
  } = useAppViewModel();

  return (
    <main className="flex flex-col h-screen max-w-[360px] mx-auto bg-black text-white overflow-hidden border-x border-[#333333] relative">
      <AnimatePresence mode="wait">
        {appState === 'splash' && <SplashView key="splash" />}

        {appState === 'onboarding' && (
          <OnboardingView key="onboarding" onComplete={handleAuthSuccess} />
        )}

        {appState === 'auth' && (
          <AuthView key="auth" onAuthSuccess={handleAuthSuccess} />
        )}

        {appState === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full w-full relative"
          >
            {/* Sub-Views (Overlays) */}
            <AnimatePresence>
              {subView === 'find' && <FindRideView onClose={closeSubView} />}
              {subView === 'post' && <PostRideView onClose={closeSubView} />}
              {subView === 'safety' && (
                <SafetyView
                  onClose={closeSubView}
                  contacts={contacts}
                  loadingContacts={loadingContacts}
                  onAddContact={addContact}
                />
              )}
              {subView === 'notifications' && <NotificationsView onClose={closeSubView} />}
              {subView === 'chat_list' && <ChatListView onClose={closeSubView} />}
              {subView === 'planner' && <PlannerView onClose={closeSubView} />}
            </AnimatePresence>

            {/* Mode Switch Confirmation Dialog */}
            <AnimatePresence>
              {showSwitchConfirm && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#212121] rounded-[24px] p-6 w-full max-w-[320px] border border-[#333333] shadow-2xl flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-5">
                      <RefreshCw className="text-[#FFD500] w-8 h-8" />
                    </div>
                    <h3 className="text-[22px] font-bold text-white mb-2">Switch Mode</h3>
                    <p className="text-[#ABABAB] text-[16px] leading-relaxed mb-8">
                      Are you sure you want to switch to <span className="text-[#FFD500] font-bold">{userMode === 'passenger' ? 'Driver' : 'Passenger'}</span> mode?
                    </p>
                    <div className="flex w-full gap-4">
                      <button
                        onClick={cancelSwitchMode}
                        className="flex-1 h-14 text-white font-bold text-[16px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSwitchMode}
                        className="flex-1 h-14 bg-[#FFD500] text-black font-bold rounded-[16px] text-[16px]"
                      >
                        Switch
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Dynamic Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'home' && (
                <HomeView userMode={userMode} onNavigate={navigateToSubView} />
              )}
              {activeTab === 'rides' && (
                <RidesView userMode={userMode} />
              )}
              {activeTab === 'explore' && (
                <ChatView />
              )}
              {activeTab === 'profile' && (
                <ProfileView
                  userMode={userMode}
                  onLogout={handleLogout}
                  onNavigate={navigateToSubView}
                  onSwitchRequest={requestSwitchMode}
                />
              )}
            </div>

            {/* Bottom Navigation */}
            {!subView && !showSwitchConfirm && (
              <BottomNav activeTab={activeTab} setActiveTab={setActiveTab as any} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
