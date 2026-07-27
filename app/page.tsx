'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// MVVM: Components (View)
import SplashView from '@/components/SplashView';
import OnboardingView from '@/components/OnboardingView';
import AuthView from '@/components/AuthView';
import CompleteProfileView from '@/components/CompleteProfileView';
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
import ChatDetailView from '@/components/ChatDetailView';
import PlannerView from '@/components/PlannerView';
import TrackRideView from '@/components/TrackRideView';
import DriverTrackRideView from '@/components/DriverTrackRideView';
import DriverRegistrationView from '@/components/DriverRegistrationView';
import RideDetailsView from '@/components/RideDetailsView';
import RideSummaryView from '@/components/RideSummaryView';
import FinancialReportView from '@/components/FinancialReportView';
import GlobalChatView from '@/components/GlobalChatView';
import SettingsView from '@/components/SettingsView';
import EmailVerificationView from '@/components/EmailVerificationView';
import ForgetPasswordView from '@/components/ForgetPasswordView';
import DriverManifestView from '@/components/DriverManifestView';
import ContentView from '@/components/ContentView';
import PickupSelectorView from '@/components/PickupSelectorView';
import DriverProfileDetailView from '@/components/DriverProfileDetailView';
import DriverManagementView from '@/components/DriverManagementView';

// Android Dialogs & Menus
import LogoutDialog from '@/components/ui/LogoutDialog';
import RateUserDialog from '@/components/ui/RateUserDialog';
import DriverConsentDialog from '@/components/ui/DriverConsentDialog';
import ChatMenu from '@/components/ui/ChatMenu';
import PostOptionsMenu from '@/components/ui/PostOptionsMenu';
import ProfilePictureViewerDialog from '@/components/ui/ProfilePictureViewerDialog';
import AppealDialog from '@/components/ui/AppealDialog';

// MVVM: ViewModel
import { useAppViewModel } from '@/hooks/useAppViewModel';

export default function AppContainer() {
  const {
    appState, userMode, activeTab, subView,
    showSwitchConfirm, showLogoutConfirm, showRateDialog, showConsent,
    showChatMenu, showPostOptionsMenu, showProfilePicViewer, showAppealDialog,
    setShowChatMenu, setShowPostOptionsMenu, setShowProfilePicViewer, setShowAppealDialog,
    setActiveTab, handleAuthSuccess, handleLogout, handleSwitchMode,
    navigateToSubView, closeSubView, requestSwitchMode, cancelSwitchMode,
    requestLogout, cancelLogout, openAiAssistant,
    stats, activeRide, notifications, chats, unreadNotifications, unreadChats,
    contacts, loadingContacts, addContact, onProfileComplete, profileData,
    selectedChat, openChatDetail, selectedRideId, openRideDetails,
    completedRideData, ratingTarget, submitRating, closeRateDialog,
    contentViewData, openContentView, closeContentView, openForgetPassword, closeAuthFlow,
    selectedDriverId, openDriverProfile, openPhotoViewer, photoViewerUrl,
    exitChat, deletePost, submitAppeal,
    currentRouteDirections, openPickupSelector, setSelectedPickupLocation, selectedPickupLocation
  } = useAppViewModel();

  return (
    <main className="flex flex-col h-screen max-w-[360px] mx-auto bg-black text-white overflow-hidden border-x border-[#333333] relative shadow-2xl">
      <AnimatePresence mode="wait">
        {appState === 'splash' && <SplashView key="splash" />}

        {appState === 'onboarding' && (
          <OnboardingView key="onboarding" onComplete={handleAuthSuccess} />
        )}

        {appState === 'auth' && (
          <AuthView
            key="auth"
            onAuthSuccess={handleAuthSuccess}
            openForgetPassword={openForgetPassword}
          />
        )}

        {appState === 'forget_password' && (
          <ForgetPasswordView key="forget" onClose={closeAuthFlow} />
        )}

        {appState === 'email_verification' && (
          <EmailVerificationView
            key="verify"
            onVerified={handleAuthSuccess}
            onBackToLogin={handleLogout}
          />
        )}

        {appState === 'complete_profile' && (
          <CompleteProfileView key="profile_gate" onComplete={onProfileComplete} />
        )}

        {appState === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full w-full relative"
          >
            {/* Sub-Views (Full Screen Overlays) */}
            <AnimatePresence>
              {subView === 'find' && (
                <FindRideView
                  key="find"
                  onClose={closeSubView}
                  onRideClick={openRideDetails}
                  onViewDriverProfile={openDriverProfile}
                />
              )}
              {subView === 'post' && <PostRideView key="post" onClose={closeSubView} />}
              {subView === 'safety' && (
                <SafetyView onClose={closeSubView} contacts={contacts} loadingContacts={loadingContacts} onAddContact={addContact} />
              )}
              {subView === 'notifications' && <NotificationsView key="notif" onClose={closeSubView} />}
              {subView === 'chat_list' && (
                <ChatListView key="chat_list" onClose={closeSubView} chats={chats} onChatClick={openChatDetail} />
              )}
              {subView === 'chat_detail' && (
                <ChatDetailView key="chat_detail" onClose={closeSubView} chat={selectedChat} onExitChat={exitChat} />
              )}
              {subView === 'planner' && <PlannerView key="planner" onClose={closeSubView} />}
              {subView === 'track_ride' && (
                activeRide?.isDriver ? (
                  <DriverTrackRideView key="track_driver" onClose={closeSubView} rideId={activeRide.id} />
                ) : (
                  <TrackRideView key="track_passenger" onClose={closeSubView} rideInfo={activeRide} />
                )
              )}
              {subView === 'driver_mgmt' && (
                <DriverManagementView
                  key="mgmt"
                  onClose={closeSubView}
                  onApply={() => navigateToSubView('driver_reg')}
                  onAppeal={() => setShowAppealDialog(true)}
                  status={profileData?.verificationStatus || 'none'}
                  rejectionReason={profileData?.rejectionReason}
                />
              )}
              {subView === 'driver_reg' && <DriverRegistrationView key="reg" onClose={closeSubView} status={profileData?.verificationStatus || 'none'} />}
              {subView === 'ride_details' && (
                <RideDetailsView
                  key="details"
                  onClose={closeSubView}
                  rideId={selectedRideId}
                  onSelectPickupOnMap={openPickupSelector}
                  selectedPickup={selectedPickupLocation}
                  onViewDriverProfile={openDriverProfile}
                />
              )}
              {subView === 'financial' && <FinancialReportView key="finance" onClose={closeSubView} />}
              {subView === 'summary' && <RideSummaryView key="summary" onClose={closeSubView} rideData={completedRideData} />}
              {subView === 'global_chat' && <GlobalChatView key="global" onClose={closeSubView} />}
              {subView === 'settings' && <SettingsView key="settings" onClose={closeSubView} onOpenContent={openContentView} />}
              {subView === 'driver_profile' && selectedDriverId && (
                <DriverProfileDetailView key="d_profile" driverId={selectedDriverId} onClose={closeSubView} />
              )}
              {subView === 'driver_manifest' && activeRide?.id && (
                <DriverManifestView key="manifest" onClose={closeSubView} rideId={activeRide.id} />
              )}
              {subView === 'pickup_selector' && (
                <PickupSelectorView
                  key="pickup_map"
                  onClose={closeSubView}
                  onConfirm={(loc) => {
                    setSelectedPickupLocation(loc);
                    closeSubView();
                  }}
                  routeDirections={currentRouteDirections}
                />
              )}
            </AnimatePresence>

            {/* Content View Overlay */}
            <AnimatePresence>
              {contentViewData && (
                <ContentView
                  key="content_view"
                  title={contentViewData.title}
                  content={contentViewData.content}
                  faqs={contentViewData.faqs}
                  onClose={closeContentView}
                />
              )}
            </AnimatePresence>

            {/* Global Overlays (Dialogs & Menus) */}
            <LogoutDialog isOpen={showLogoutConfirm} onClose={cancelLogout} onConfirm={handleLogout} />

            <RateUserDialog
              isOpen={showRateDialog}
              onClose={closeRateDialog}
              targetName={ratingTarget?.name || 'User'}
              targetPhoto={ratingTarget?.photo}
              onSubmit={submitRating}
            />

            <ChatMenu
              isOpen={showChatMenu}
              onClose={() => setShowChatMenu(false)}
              onClearChat={() => {}}
              onExitChat={exitChat}
              isAiChat={activeTab === 'explore'}
            />

            <PostOptionsMenu
              isOpen={showPostOptionsMenu}
              onClose={() => setShowPostOptionsMenu(false)}
              onDelete={() => deletePost(selectedRideId || '')}
            />

            <ProfilePictureViewerDialog
              isOpen={showProfilePicViewer}
              onClose={() => setShowProfilePicViewer(false)}
              photoUrl={photoViewerUrl}
              canEdit={true}
            />

            <AppealDialog
              isOpen={showAppealDialog}
              onClose={() => setShowAppealDialog(false)}
              onSubmit={submitAppeal}
              onReapply={() => navigateToSubView('driver_reg')}
            />

            {/* Mode Switch Dialog */}
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
                    <h3 className="text-[22px] font-bold text-white mb-2 tracking-tight">Switch Mode</h3>
                    <p className="text-[#ABABAB] text-[16px] leading-relaxed mb-8 font-medium">
                      Are you sure you want to switch to <span className="text-[#FFD500] font-bold uppercase tracking-tight">{userMode === 'passenger' ? 'Driver' : 'Passenger'}</span> mode?
                    </p>
                    <div className="flex w-full gap-4">
                      <button onClick={cancelSwitchMode} className="flex-1 h-14 text-white font-bold">Cancel</button>
                      <button onClick={handleSwitchMode} className="flex-1 h-14 bg-[#FFD500] text-black font-bold rounded-[16px]">Switch</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Dynamic Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {activeTab === 'home' && (
                <HomeView
                  userMode={userMode}
                  onNavigate={navigateToSubView}
                  onOpenAiAssistant={openAiAssistant}
                  stats={stats}
                  activeRide={activeRide}
                  unreadNotifications={unreadNotifications}
                  unreadChats={unreadChats}
                />
              )}
              {activeTab === 'rides' && (
                <RidesView
                  userMode={userMode}
                  onOpenOptions={(id) => {
                    setSelectedRideId(id);
                    setShowPostOptionsMenu(true);
                  }}
                />
              )}
              {activeTab === 'explore' && <ChatView />}
              {activeTab === 'profile' && (
                <ProfileView
                  userMode={userMode}
                  profileData={profileData}
                  onLogout={requestLogout}
                  onNavigate={navigateToSubView}
                  onSwitchRequest={requestSwitchMode}
                  onViewPhoto={openPhotoViewer}
                />
              )}
            </div>

            {!subView && !showSwitchConfirm && !showLogoutConfirm && !showRateDialog && !contentViewData && (
              <BottomNav activeTab={activeTab} setActiveTab={setActiveTab as any} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
