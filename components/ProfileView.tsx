'use client';

import {
  User,
  Shield,
  ClipboardList,
  Star,
  Settings,
  LogOut,
  ArrowLeft,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { UserMode, SubView, UserProfile } from '@/types';
import Button from './ui/Button';
import Card from './ui/Card';
import Link from 'next/link';

interface ProfileViewProps {
  userMode: UserMode;
  profileData: UserProfile | null;
  onLogout: () => void;
  onNavigate: (view: SubView) => void;
  onSwitchRequest: () => void;
}

export default function ProfileView({ userMode, profileData, onLogout, onNavigate, onSwitchRequest }: ProfileViewProps) {
  const initials = profileData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';

  return (
    <div className="p-6 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center space-y-4 pt-4">
        <div className="relative">
          <div className="w-24 h-24 bg-[#FFD500] rounded-[32px] flex items-center justify-center text-black font-black text-3xl shadow-xl border-4 border-[#212121]">
            {profileData?.photoUrl ? (
              <img src={profileData.photoUrl} alt="Profile" className="w-full h-full object-cover rounded-[28px]" />
            ) : initials}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#22C55E] w-8 h-8 rounded-full border-4 border-black flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-[24px] font-black text-white">{profileData?.name || 'Loading...'}</h2>
          <p className="text-[#666666] text-xs font-bold uppercase tracking-widest">
            {userMode === 'passenger' ? 'Passenger Account' : 'Verified Driver'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Switch Mode Button */}
        <Button
          onClick={onSwitchRequest}
          className="flex justify-between items-center p-6 !h-auto shadow-lg !rounded-[24px] border border-white/5"
        >
          <div className="flex items-center gap-4">
            <RefreshCw className="w-6 h-6" />
            <span className="font-bold text-[16px]">Switch to {userMode === 'passenger' ? 'Driver' : 'Passenger'} Mode</span>
          </div>
          <ChevronRight className="w-5 h-5 opacity-50" />
        </Button>

        {/* Admin Link (Only visible if isAdmin is true) */}
        {profileData?.isAdmin && (
          <Link href="/nomanthesuperadmin" className="block">
            <Card variant="active" radius="xl" className="flex items-center justify-between p-5 border-[#FFD500]">
              <div className="flex items-center gap-4">
                <ShieldAlert className="w-6 h-6 text-[#FFD500]" />
                <span className="font-black text-[16px] text-[#FFD500] uppercase tracking-tight">Admin Control Center</span>
              </div>
              <ExternalLink className="w-5 h-5 text-[#FFD500]" />
            </Card>
          </Link>
        )}

        {/* Menu Items */}
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: User, label: 'Personal Information' },
            { icon: Shield, label: 'Safety & Emergency', action: () => onNavigate('safety') },
            ...(userMode === 'driver' ? [{ icon: ClipboardList, label: 'Vehicle Documents', action: () => onNavigate('driver_reg') }] : []),
            { icon: Star, label: 'Ratings & Reviews' },
            { icon: Settings, label: 'Settings' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full text-left transition-transform active:scale-[0.98]"
            >
              <Card
                variant="flat"
                radius="xl"
                className="flex items-center justify-between p-5 bg-[#1A1A1A] border-white/5"
              >
                <div className="flex items-center gap-4">
                  <item.icon className="w-6 h-6 text-[#FFD500]" />
                  <span className="font-medium text-[16px] text-white/90">{item.label}</span>
                </div>
                <ChevronRight className="text-[#333333] w-5 h-5" />
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <Button
        variant="ghost"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 p-6 text-[#E46767] font-bold text-[16px] mt-4 opacity-80 hover:opacity-100"
      >
        <LogOut className="w-6 h-6" />
        <span>Logout Account</span>
      </Button>
    </div>
  );
}
