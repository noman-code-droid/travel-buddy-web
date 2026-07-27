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
  ExternalLink,
  Phone,
  FileText,
  HelpCircle,
  Check
} from 'lucide-react';
import { UserMode, SubView, UserProfile, UserStats } from '@/types';
import Button from './ui/Button';
import Card from './ui/Card';
import Link from 'next/link';

interface ProfileViewProps {
  userMode: UserMode;
  profileData: UserProfile | null;
  stats: UserStats;
  onLogout: () => void;
  onNavigate: (view: SubView) => void;
  onSwitchRequest: () => void;
  onViewPhoto: (url: string) => void;
}

export default function ProfileView({
  userMode,
  profileData,
  stats,
  onLogout,
  onNavigate,
  onSwitchRequest,
  onViewPhoto
}: ProfileViewProps) {
  const initials = profileData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header - Matches activity_profile.xml */}
      <div className="p-4 flex items-center justify-between border-b border-[#333333]">
        <h2 className="text-[20px] font-bold text-white flex-1 text-center pl-10">Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 no-scrollbar">
        <div className="p-4 space-y-6">

          {/* User Info Card - Matches userInfoCard in activity_profile.xml */}
          <div className="android-card-elevated p-5 space-y-6 bg-[#212121]">
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => profileData?.photoUrl && onViewPhoto(profileData.photoUrl)}
                  className="w-16 h-16 bg-[#2A2A2A] rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden border border-white/5 active:scale-95 transition-transform"
                >
                  {profileData?.photoUrl ? (
                    <img src={profileData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : initials}
                </button>
                <div className="absolute -bottom-0.5 -right-0.5 bg-[#FFD500] w-5 h-5 rounded-full border-2 border-[#212121] flex items-center justify-center">
                  <Check className="text-black w-3 h-3" strokeWidth={4} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-[18px] font-bold text-white truncate">{profileData?.name || 'User Name'}</h3>
                <p className="text-[13px] text-[#666666] font-medium">{profileData?.phone || 'No Phone Number'}</p>
                {userMode === 'driver' && (
                  <button
                    onClick={() => profileData?.uid && onNavigate('driver_profile')}
                    className="text-[#FFD500] text-[12px] font-bold mt-1 active:opacity-60"
                  >
                    View Driver Profile
                  </button>
                )}
              </div>

              <button
                onClick={() => onNavigate('settings')}
                className="w-10 h-10 flex items-center justify-center text-[#666666] active:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            <div className="h-px bg-[#333333] w-full" />

            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col items-center">
                <span className="text-[16px] font-bold text-[#FFD500]">{stats.trips}</span>
                <span className="text-[10px] text-[#666666] mt-0.5 uppercase tracking-widest">Trips</span>
              </div>
              <div className="w-px h-8 bg-[#333333]" />
              <div className="flex flex-col items-center">
                <span className="text-[16px] font-bold text-[#FFD500]">PKR {stats.savingsOrEarnings}</span>
                <span className="text-[10px] text-[#666666] mt-0.5 uppercase tracking-widest">Earnings</span>
              </div>
              <div className="w-px h-8 bg-[#333333]" />
              <div className="flex flex-col items-center">
                <span className="text-[16px] font-bold text-[#FFD500]">{stats.rating}</span>
                <span className="text-[10px] text-[#666666] mt-0.5 uppercase tracking-widest">Rating</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-[13px] font-bold text-[#666666] uppercase ml-2 tracking-widest">Settings & More</h4>

            <div className="bg-[#212121] rounded-[24px] overflow-hidden border border-white/[0.03]">
              <button
                onClick={onSwitchRequest}
                className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                  <RefreshCw className="text-[#FFD500] w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-white">Switch to {userMode === 'passenger' ? 'Driver' : 'Passenger'} Mode</p>
                  <p className="text-[11px] text-[#666666] font-medium mt-0.5">Access {userMode === 'passenger' ? 'driver' : 'passenger'} features</p>
                </div>
                <ChevronRight className="text-[#333333] w-5 h-5" />
              </button>

              <div className="h-px bg-[#333333] ml-16" />

              <button
                onClick={() => onNavigate('financial')}
                className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                  <FileText className="text-black w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-white">Financial Report</p>
                  <p className="text-[11px] text-[#666666] font-medium mt-0.5">View earnings and savings history</p>
                </div>
                <ChevronRight className="text-[#333333] w-5 h-5" />
              </button>

              <div className="h-px bg-[#333333] ml-16" />

              <button
                onClick={() => onNavigate('driver_mgmt')}
                className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                  <ClipboardList className="text-[#FFD500] w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-white">{userMode === 'passenger' ? 'Become a Driver' : 'Manage My Rides'}</p>
                  <p className="text-[11px] text-[#666666] font-medium mt-0.5">{userMode === 'passenger' ? 'Join our community' : 'View your posts & passengers'}</p>
                </div>
                <ChevronRight className="text-[#333333] w-5 h-5" />
              </button>

              <div className="h-px bg-[#333333] ml-16" />

              <button
                onClick={() => onNavigate('safety')}
                className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                  <Shield className="text-[#FFD500] w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-white">Trusted Contacts</p>
                  <p className="text-[11px] text-[#666666] font-medium mt-0.5">Safety & emergency contacts</p>
                </div>
                <ChevronRight className="text-[#333333] w-5 h-5" />
              </button>

              <div className="h-px bg-[#333333] ml-16" />

              <button
                onClick={() => onNavigate('settings')}
                className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                  <Settings className="text-[#FFD500] w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-white">Settings</p>
                  <p className="text-[11px] text-[#666666] font-medium mt-0.5">Preferences & privacy</p>
                </div>
                <ChevronRight className="text-[#333333] w-5 h-5" />
              </button>

              <div className="h-px bg-[#333333] ml-16" />

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <LogOut className="text-[#E46767] w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-[#E46767]">Logout</p>
                  <p className="text-[11px] text-red-500/60 mt-0.5 font-medium">Sign out of your account</p>
                </div>
                <ChevronRight className="text-red-500/10 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Admin Link */}
        {profileData?.isAdmin && (
          <div className="px-6 mt-4">
            <Link href="/nomanthesuperadmin" className="block">
              <div className="bg-[#FFD500] p-4 rounded-[20px] flex items-center justify-between border border-black/10">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="text-black w-5 h-5" />
                  <span className="font-bold text-[12px] text-black uppercase">System Super Admin</span>
                </div>
                <ExternalLink className="w-4 h-4 text-black" />
              </div>
            </Link>
          </div>
        )}

        <div className="text-center mt-12 mb-10">
          <p className="text-[10px] font-medium text-[#444444] uppercase tracking-widest">Version 2.5.0</p>
        </div>
      </div>
    </div>
  );
}
