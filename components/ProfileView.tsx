'use client';

import { User, Shield, ClipboardList, Star, Settings, LogOut, ArrowLeft, RefreshCw, ChevronRight } from 'lucide-react';
import { UserMode, SubView } from '@/types';
import Button from './ui/Button';
import Card from './ui/Card';

interface ProfileViewProps {
  userMode: UserMode;
  onLogout: () => void;
  onNavigate: (view: SubView) => void;
  onSwitchRequest: () => void;
}

export default function ProfileView({ userMode, onLogout, onNavigate, onSwitchRequest }: ProfileViewProps) {
  return (
    <div className="p-6 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center space-y-4 pt-4">
        <div className="relative">
          <div className="w-24 h-24 bg-[#FFD500] rounded-full flex items-center justify-center text-black font-bold text-3xl shadow-lg">
            NA
          </div>
          <div className="absolute bottom-1 right-1 bg-[#22C55E] w-7 h-7 rounded-full border-4 border-black" />
        </div>
        <div className="text-center">
          <h2 className="text-[22px] font-bold text-white">Noman Ashraf</h2>
          <p className="text-[#ABABAB] text-[15px]">{userMode === 'passenger' ? 'Passenger Account' : 'Driver Account'}</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Switch Mode Button - Using reusable Button component with variant */}
        <Button
          onClick={onSwitchRequest}
          className="flex justify-between items-center p-5 !h-auto shadow-lg"
        >
          <div className="flex items-center gap-4">
            <RefreshCw className="w-6 h-6" />
            <span className="font-bold text-[16px]">Switch to {userMode === 'passenger' ? 'Driver' : 'Passenger'} Mode</span>
          </div>
          <ChevronRight className="w-5 h-5" />
        </Button>

        {/* Menu Items - Using reusable Card component */}
        {[
          { icon: User, label: 'Personal Information' },
          { icon: Shield, label: 'Safety & Emergency', action: () => onNavigate('safety') },
          ...(userMode === 'driver' ? [{ icon: ClipboardList, label: 'Vehicle Documents' }] : []),
          { icon: Star, label: 'Ratings & Reviews' },
          { icon: Settings, label: 'Settings' },
        ].map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className="w-full text-left"
          >
            <Card
              variant="flat"
              radius="xl"
              className="flex items-center justify-between p-5 active:bg-[#333333] transition-all"
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-6 h-6 text-[#FFD500]" />
                <span className="font-medium text-[16px] text-white">{item.label}</span>
              </div>
              <ArrowLeft className="text-[#666666] w-5 h-5 rotate-180" />
            </Card>
          </button>
        ))}
      </div>

      {/* Logout Button - Using reusable Button component with destructive variant */}
      <Button
        variant="ghost"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 p-6 text-[#E46767] font-bold text-[16px] mt-4"
      >
        <LogOut className="w-6 h-6" />
        <span>Logout Account</span>
      </Button>
    </div>
  );
}
