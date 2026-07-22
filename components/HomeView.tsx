'use client';

import { User, Bell, MessageSquare, Search, Plus, Compass, Bot, ClipboardList, Users } from 'lucide-react';
import { UserMode, SubView } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';

interface HomeViewProps {
  userMode: UserMode;
  onNavigate: (view: SubView) => void;
}

export default function HomeView({ userMode, onNavigate }: HomeViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Sticky App Bar */}
      <div className="sticky top-0 z-20 bg-black p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFD500] rounded-full flex items-center justify-center overflow-hidden">
            <User className="text-black w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-white">Noman Ashraf</h1>
            <p className="text-[12px] text-[#ABABAB]">{userMode === 'passenger' ? 'Passenger Mode' : 'Driver Mode'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => onNavigate('notifications')} className="relative">
             <Bell className="text-white w-7 h-7" />
             <span className="badge-dot">1</span>
           </button>
           <button onClick={() => onNavigate('chat_list')} className="relative">
             <MessageSquare className="text-white w-7 h-7" />
             <span className="badge-dot">1</span>
           </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="flex gap-3">
           <Card className="flex-1 p-4 flex flex-col items-center">
             <span className="text-[17px] font-bold text-white">0</span>
             <span className="text-[11px] text-[#ABABAB]">Trips</span>
           </Card>
           <Card className="flex-1 p-4 flex flex-col items-center">
             <span className="text-[17px] font-bold text-white">PKR 0</span>
             <span className="text-[11px] text-[#ABABAB]">{userMode === 'passenger' ? 'Savings' : 'Earnings'}</span>
           </Card>
           <Card className="flex-1 p-4 flex flex-col items-center">
             <span className="text-[17px] font-bold text-[#FFD500]">★ 5.0</span>
             <span className="text-[11px] text-[#ABABAB]">Rating</span>
           </Card>
        </div>

        <div>
          <h2 className="text-[18px] font-bold text-white">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => onNavigate('find')} className="bg-[#212121] rounded-[24px] p-4 flex flex-col items-center gap-2 transition-all active:bg-[#333333]">
              <Search className="w-8 h-8 text-[#FFD500]" />
              <span className="text-[14px] text-white">Find Ride</span>
            </button>
            <button onClick={() => onNavigate('post')} className="bg-[#212121] rounded-[24px] p-4 flex flex-col items-center gap-2 transition-all active:bg-[#333333]">
              <Plus className="w-8 h-8 text-[#FFD500]" />
              <span className="text-[14px] text-white">Post Ride</span>
            </button>
            <button onClick={() => onNavigate('planner')} className="bg-[#212121] rounded-[24px] p-4 flex flex-col items-center gap-2 transition-all active:bg-[#333333]">
              <Compass className="w-8 h-8 text-[#FFD500]" />
              <span className="text-[14px] text-white">AI Planner</span>
            </button>
            <button onClick={() => onNavigate('explore' as any)} className="bg-[#212121] rounded-[24px] p-4 flex flex-col items-center gap-2 transition-all active:bg-[#333333]">
              <Bot className="w-8 h-8 text-[#FFD500]" />
              <span className="text-[14px] text-white">AI Assistant</span>
            </button>
          </div>

          <div className="flex justify-center mt-2">
            <button className="w-full bg-[#212121] rounded-[24px] p-4 flex flex-col items-center gap-2 transition-all active:bg-[#333333]">
              <ClipboardList className="w-8 h-8 text-[#FFD500]" />
              <span className="text-[14px] text-white">{userMode === 'passenger' ? 'My Bookings' : 'Ride Requests'}</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-[18px] font-bold text-white">{userMode === 'passenger' ? 'Active Ride' : 'Current Post'}</h2>
          <Card radius="3xl" className="p-5 mt-4 border border-[#333333]/50 shadow-lg">
            {userMode === 'passenger' ? (
              <>
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#FFD500] rounded-full flex items-center justify-center overflow-hidden">
                        <User className="text-black w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-[18px] font-bold text-white">Ahmed Ali</h3>
                        <p className="text-[14px] text-[#ABABAB]">Toyota Corolla</p>
                      </div>
                   </div>
                   <span className="text-[14px] font-bold text-[#FFD500]">ETA 5m</span>
                </div>
                <p className="text-[15px] text-[#ABABAB] mt-5 mb-6">To: University of Lahore</p>
                <Button className="rounded-[32px]">Track Ride</Button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-4 text-[#FFD500]">
                      <Users className="w-8 h-8" />
                      <div>
                        <h3 className="text-[18px] font-bold text-white">3 Seats Empty</h3>
                        <p className="text-[14px] text-[#ABABAB]">Destination: Model Town</p>
                      </div>
                   </div>
                   <span className="text-[14px] font-bold text-[#22C55E]">Published</span>
                </div>
                <div className="mt-5 mb-6 flex justify-between items-center text-sm">
                   <span className="text-[#ABABAB]">Suggested Price: RS 350</span>
                   <span className="text-[#FFD500] font-bold">1 Request Pending</span>
                </div>
                <Button className="rounded-[32px]">Manage Ride</Button>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
