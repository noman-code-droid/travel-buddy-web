'use client';

import { Home, Car, Sparkles, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'rides', icon: Car, label: 'Rides' },
    { id: 'explore', icon: Sparkles, label: 'AI Chat' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="flex justify-around items-center p-3 border-t border-[#333333] bg-black">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === tab.id ? 'text-[#FFD500]' : 'text-white opacity-60'
          }`}
        >
          <tab.icon className="w-6 h-6" />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
