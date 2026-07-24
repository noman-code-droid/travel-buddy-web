'use client';

import { User, Bell, MessageSquare, Search, Plus, Compass, Bot, ClipboardList, Users, Navigation, Globe } from 'lucide-react';
import { UserMode, SubView, UserStats, ActiveRideInfo } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';

interface HomeViewProps {
  userMode: UserMode;
  onNavigate: (view: SubView) => void;
  stats: UserStats;
  activeRide: ActiveRideInfo | null;
  unreadNotifications: number;
  unreadChats: number;
}

export default function HomeView({
  userMode,
  onNavigate,
  stats,
  activeRide,
  unreadNotifications,
  unreadChats
}: HomeViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Sticky App Bar (activity_main.xml parity) */}
      <div className="sticky top-0 z-20 bg-black p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFD500] rounded-full flex items-center justify-center overflow-hidden border-2 border-[#FFD500]">
            <User className="text-black w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-white">Travel Buddy</h1>
            <p className="text-[11px] text-[#ABABAB] uppercase tracking-wider font-bold">
              {userMode === 'passenger' ? 'Passenger' : 'Driver'} Mode
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => onNavigate('notifications')} className="relative p-1">
             <Bell className="text-white w-7 h-7" />
             {unreadNotifications > 0 && (
               <span className="badge-dot">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
             )}
           </button>
           <button onClick={() => onNavigate('chat_list')} className="relative p-1">
             <MessageSquare className="text-white w-7 h-7" />
             {unreadChats > 0 && (
               <span className="badge-dot">{unreadChats > 9 ? '9+' : unreadChats}</span>
             )}
           </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Stats (activity_main.xml parity) */}
        <div className="flex gap-3">
           <Card className="flex-1 p-4 flex flex-col items-center">
             <span className="text-[17px] font-bold text-white">{stats.trips}</span>
             <span className="text-[11px] text-[#ABABAB]">{userMode === 'passenger' ? 'Trips' : 'Driver Trips'}</span>
           </Card>
           <button
             onClick={() => onNavigate('financial')}
             className="flex-1 text-center active:scale-95 transition-transform"
           >
             <Card className="p-4 flex flex-col items-center">
               <span className="text-[17px] font-bold text-white">PKR {stats.savingsOrEarnings}</span>
               <span className="text-[11px] text-[#ABABAB]">{userMode === 'passenger' ? 'Savings' : 'Earnings'}</span>
             </Card>
           </button>
           <Card className="flex-1 p-4 flex flex-col items-center">
             <span className="text-[17px] font-bold text-[#FFD500]">{stats.rating}</span>
             <span className="text-[11px] text-[#ABABAB]">Rating</span>
           </Card>
        </div>

        {/* Global Chat CTA (activity_main.xml addition) */}
        <Card
          variant="active"
          className="p-4 flex items-center justify-between cursor-pointer"
          onClick={() => onNavigate('global_chat')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD500] rounded-full flex items-center justify-center">
              <Globe className="text-black w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Global Community</p>
              <p className="text-[10px] text-[#ABABAB]">Connect with travelers nearby</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#FFD500]" />
        </Card>

        {/* Quick Actions (activity_main.xml parity) */}
        <div>
          <h2 className="text-[18px] font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('find')}
              className="bg-[#212121] rounded-[24px] p-5 flex flex-col items-center gap-3 transition-all active:bg-[#333333] border border-transparent active:border-[#FFD500]/30"
            >
              <div className="w-12 h-12 bg-[#FFD50010] rounded-full flex items-center justify-center">
                <Search className="w-7 h-7 text-[#FFD500]" />
              </div>
              <span className="text-[14px] font-medium text-white">Explore</span>
            </button>

            <button
              onClick={() => onNavigate('post')}
              className="bg-[#212121] rounded-[24px] p-5 flex flex-col items-center gap-3 transition-all active:bg-[#333333] border border-transparent active:border-[#FFD500]/30"
            >
              <div className="w-12 h-12 bg-[#FFD50010] rounded-full flex items-center justify-center">
                <Plus className="w-7 h-7 text-[#FFD500]" />
              </div>
              <span className="text-[14px] font-medium text-white">Post a Ride</span>
            </button>

            <button
              onClick={() => onNavigate('planner')}
              className="bg-[#212121] rounded-[24px] p-5 flex flex-col items-center gap-3 transition-all active:bg-[#333333] border border-transparent active:border-[#FFD500]/30"
            >
              <div className="w-12 h-12 bg-[#FFD50010] rounded-full flex items-center justify-center">
                <Compass className="w-7 h-7 text-[#FFD500]" />
              </div>
              <span className="text-[14px] font-medium text-white">AI Planner</span>
            </button>

            <button
              onClick={() => onNavigate('explore' as any)}
              className="bg-[#212121] rounded-[24px] p-5 flex flex-col items-center gap-3 transition-all active:bg-[#333333] border border-transparent active:border-[#FFD500]/30"
            >
              <div className="w-12 h-12 bg-[#FFD50010] rounded-full flex items-center justify-center">
                <Bot className="w-7 h-7 text-[#FFD500]" />
              </div>
              <span className="text-[14px] font-medium text-white">AI Assistant</span>
            </button>
          </div>

          <div className="flex justify-center mt-3">
            <button className="w-[80%] bg-[#212121] rounded-[24px] p-5 flex flex-col items-center gap-3 transition-all active:bg-[#333333] border border-transparent active:border-[#FFD500]/30">
              <div className="w-12 h-12 bg-[#FFD50010] rounded-full flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-[#FFD500]" />
              </div>
              <span className="text-[14px] font-medium text-white">
                {userMode === 'passenger' ? 'My Bookings' : 'Received Bookings'}
              </span>
            </button>
          </div>
        </div>

        {/* Active Ride Section (activity_track_ride.xml parity) */}
        {activeRide && (
          <div>
            <h2 className="text-[18px] font-bold text-white mb-4">Active Ride</h2>
            <Card radius="3xl" className="p-6 border border-[#333333]/50 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className={`text-[12px] font-black uppercase tracking-tighter ${activeRide.status.includes('picked') ? 'text-[#22C55E]' : 'text-[#FFD500]'}`}>
                  {activeRide.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#FFD500] rounded-full flex items-center justify-center overflow-hidden border-2 border-black">
                  {activeRide.driverPhoto ? (
                    <img src={activeRide.driverPhoto} alt="Driver" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-black w-8 h-8" />
                  )}
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-white">{activeRide.driverName}</h3>
                  <p className="text-[14px] text-[#ABABAB]">{activeRide.isDriver ? 'Driver' : 'Passenger'}</p>
                </div>
              </div>

              <p className="text-[14px] text-white/90 bg-white/5 p-3 rounded-xl mb-6 flex items-start gap-2">
                <Navigation className="w-4 h-4 text-[#FFD500] mt-0.5 shrink-0" />
                {activeRide.route}
              </p>

              <Button
                onClick={() => onNavigate('track_ride')}
                className="!h-[56px] rounded-[24px]"
              >
                Track Ride
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
