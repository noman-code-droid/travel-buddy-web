'use client';

import {
  User,
  Bell,
  MessageSquare,
  Search,
  Plus,
  Compass,
  Bot,
  ClipboardList,
  Navigation,
  Globe,
  ChevronRight,
  Star
} from 'lucide-react';
import { UserMode, SubView, UserStats, ActiveRideInfo, ActiveTab } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';

interface HomeViewProps {
  userMode: UserMode;
  onNavigate: (view: SubView) => void;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAiAssistant: () => void;
  stats: UserStats;
  activeRide: ActiveRideInfo | null;
  unreadNotifications: number;
  unreadChats: number;
}

export default function HomeView({
  userMode,
  onNavigate,
  onTabChange,
  onOpenAiAssistant,
  stats,
  activeRide,
  unreadNotifications,
  unreadChats
}: HomeViewProps) {
  return (
    <div className="flex flex-col h-full bg-black">
      {/* Sticky App Bar - Matches activity_main.xml header */}
      <div className="sticky top-0 z-20 bg-black p-4 flex justify-between items-center">
        <h1 className="text-[20px] font-bold text-[#FFD500]">Travel Buddy</h1>

        <div className="flex items-center gap-4">
           {/* Notification with Badge */}
           <button onClick={() => onNavigate('notifications')} className="relative p-1">
             <Bell className="text-white w-7 h-7" />
             {unreadNotifications > 0 && (
               <span className="badge-dot">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
             )}
           </button>

           {/* Chat with Badge */}
           <button onClick={() => onNavigate('chat_list')} className="relative p-1">
             <MessageSquare className="text-white w-7 h-7" />
             {unreadChats > 0 && (
               <span className="badge-dot">{unreadChats > 9 ? '9+' : unreadChats}</span>
             )}
           </button>

           {/* Profile Circle */}
           <button
             onClick={() => onTabChange('profile')}
             className="w-9 h-9 bg-[#212121] rounded-full flex items-center justify-center overflow-hidden border border-white/5 active:scale-95 transition-transform"
           >
             <User className="text-[#ABABAB] w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="p-4 space-y-8">
        {/* Quick Stats - Matches activity_main.xml horizontal layout */}
        <div className="flex gap-3 px-1">
           <Card className="flex-1 p-4 flex flex-col items-center justify-center !rounded-[16px]">
             <span className="text-[17px] font-bold text-white">{stats.trips}</span>
             <span className="text-[11px] text-[#666666] mt-0.5">Trips</span>
           </Card>

           <button
             onClick={() => onNavigate('financial')}
             className="flex-1 text-center active:scale-95 transition-transform"
           >
             <Card className="h-full p-4 flex flex-col items-center justify-center !rounded-[16px]">
               <span className="text-[17px] font-bold text-white">PKR {stats.savingsOrEarnings}</span>
               <span className="text-[11px] text-[#666666] mt-0.5">
                 {userMode === 'passenger' ? 'Savings' : 'Earnings'}
               </span>
             </Card>
           </button>

           <Card className="flex-1 p-4 flex flex-col items-center justify-center !rounded-[16px]">
             <div className="flex items-center gap-1">
               <span className="text-[17px] font-bold text-[#FFD500]">★</span>
               <span className="text-[17px] font-bold text-[#FFD500]">{stats.rating}</span>
             </div>
             <span className="text-[11px] text-[#666666] mt-0.5">Rating</span>
           </Card>
        </div>



        {/* Quick Actions - Matches GridLayout columnCount="2" */}
        <div className="px-1">
          <h2 className="text-[18px] font-bold text-white mb-4 ml-1">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'find' as SubView, label: 'Explore', icon: Search },
              { id: 'post' as SubView, label: 'Post a Ride', icon: Plus },
              { id: 'planner' as SubView, label: 'AI Trip Planner', icon: Compass },
              { id: 'chat' as any, label: 'AI Trip Chat', icon: Bot, action: onOpenAiAssistant }
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => action.action ? action.action() : onNavigate(action.id)}
                className="bg-[#212121] rounded-[24px] p-6 flex flex-col items-center gap-3 transition-all active:bg-[#2a2a2a] active:scale-[0.98] group"
              >
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                  <action.icon className="w-7 h-7 text-[#FFD500]" />
                </div>
                <span className="text-[14px] font-bold text-white/90">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={() => onTabChange('rides')}
              className="w-full bg-[#212121] rounded-[24px] p-6 flex flex-col items-center gap-3 transition-all active:bg-[#2a2a2a]"
            >
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-[#FFD500]" />
              </div>
              <span className="text-[14px] font-bold text-white/90">
                {userMode === 'passenger' ? 'My Bookings' : 'Received Bookings'}
              </span>
            </button>
          </div>
        </div>

        {/* Active Ride Card - Cleaned up fonts and status */}
        {activeRide ? (
          <div className="px-1 pb-10">
            <h2 className="text-[18px] font-bold text-white mb-4 ml-1">Active Ride</h2>
            <div className="bg-[#212121] rounded-[32px] p-6 border border-white/[0.03]">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#FFD500] rounded-[28px] flex items-center justify-center overflow-hidden border-2 border-black shrink-0">
                    {activeRide.driverPhoto ? (
                      <img src={activeRide.driverPhoto} alt="Driver" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-black w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-white leading-tight">{activeRide.driverName}</h3>
                    <p className="text-[14px] text-[#666666]">{activeRide.isDriver ? 'Driver' : 'Passenger'}</p>
                  </div>
                </div>
                <span className="text-[14px] font-bold text-[#FFD500]">
                  {activeRide.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-start gap-3 mb-8 px-1">
                <Navigation className="w-5 h-5 text-[#666666] mt-0.5 shrink-0" />
                <p className="text-[15px] text-[#ABABAB] leading-relaxed">
                  {activeRide.route}
                </p>
              </div>

              <button
                onClick={() => onNavigate('track_ride')}
                className="android-btn-primary"
              >
                Track Ride
              </button>
            </div>
          </div>
        ) : (
          <div className="h-20" />
        )}
      </div>
    </div>
  );
}
