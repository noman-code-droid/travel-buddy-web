'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  Languages,
  Lock,
  ChevronRight,
  HelpCircle,
  FileText,
  ShieldCheck
} from 'lucide-react';
import Card from './ui/Card';

interface SettingsViewProps {
  onClose: () => void;
  onOpenContent: (title: string, content?: string, faqs?: any[]) => void;
}

export default function SettingsView({ onClose, onOpenContent }: SettingsViewProps) {
  const faqs = [
    { question: "How do I book a ride?", answer: "Search for your destination on the Home or Explore screen, select a ride that fits your schedule, and tap 'Book Now'. You can also make an offer if you want to negotiate the price." },
    { question: "Is Travel Buddy safe?", answer: "Yes! Every user is verified via phone. Drivers undergo a strict document verification process. We also provide real-time trip tracking and an SOS emergency button." },
    { question: "How is the fare calculated?", answer: "Fares are suggested based on the trip distance and fuel costs. However, drivers have the flexibility to set their own prices, and passengers can make counter-offers." },
    { question: "Can I cancel my booking?", answer: "Yes, you can cancel your booking from the 'My Bookings' section. Please try to cancel at least 1 hour before the trip to avoid inconveniencing the driver." },
    { question: "How do I become a driver?", answer: "Go to your Profile and tap 'Become a Driver'. You'll need to upload your CNIC, Driving License, and vehicle details for our team to review." }
  ];

  const privacyPolicy = `Last Updated: February 2026

1. Information We Collect
We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.

2. Use of Information
We may use the information we collect about you to provide, maintain, and improve our services, including to facilitate payments, send receipts, provide products and services you request, and develop new features.

3. Sharing of Information
We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including with drivers to enable them to provide the services you request.

4. Safety and Security
Your safety is our priority. We use your location data to provide real-time tracking to your trusted contacts and for our SOS emergency features.`;

  const termsOfService = `1. Acceptance of Terms
By using Travel Buddy, you agree to be bound by these terms. If you do not agree, do not use the service.

2. User Accounts
You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.

3. Rules of Conduct
Users must be respectful to one another. Any form of harassment, illegal activity, or violation of safety protocols will lead to immediate account suspension.

4. Limitation of Liability
Travel Buddy is a platform connecting travelers. While we verify users, we are not liable for the actions of individual users during trips. Always use the built-in safety features.`;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[75] flex flex-col"
    >
      <div className="p-4 flex items-center justify-between border-b border-[#333333] bg-black sticky top-0 z-10">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center active:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="text-white w-7 h-7 rotate-180" />
        </button>
        <h2 className="text-[20px] font-bold text-white flex-1 text-center pr-10">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-10 no-scrollbar">

        <div className="space-y-4">
          <h3 className="text-[12px] font-black text-[#666666] uppercase tracking-[0.2em] ml-2">Preferences</h3>
          <div className="bg-[#212121] rounded-[24px] overflow-hidden border border-white/[0.02]">
            <div className="flex items-center gap-4 p-5">
              <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                <Bell className="text-[#FFD500] w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-white">Notifications</p>
                <p className="text-[11px] text-[#666666] font-medium mt-0.5">Enable push notifications</p>
              </div>
              <div className="w-12 h-7 bg-[#FFD500] rounded-full p-1 flex items-center justify-end">
                <div className="w-5 h-5 bg-black rounded-full shadow-sm" />
              </div>
            </div>

            <div className="h-px bg-[#333333] ml-16" />

            <button className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left">
              <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                <Languages className="text-[#FFD500] w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-white">Language</p>
                <p className="text-[11px] text-[#666666] font-medium mt-0.5">English (More coming soon)</p>
              </div>
              <ChevronRight className="text-[#333333] w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[12px] font-black text-[#666666] uppercase tracking-[0.2em] ml-2">Security</h3>
          <div className="bg-[#212121] rounded-[24px] overflow-hidden border border-white/[0.02]">
            <button
              onClick={() => onOpenContent('Privacy & Security', 'Your data is encrypted and handled according to international security standards. We do not sell your personal information to third parties.')}
              className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                <Lock className="text-[#FFD500] w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-white">Privacy & Security</p>
                <p className="text-[11px] text-[#666666] font-medium mt-0.5">Control your data</p>
              </div>
              <ChevronRight className="text-[#333333] w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[12px] font-black text-[#666666] uppercase tracking-[0.2em] ml-2">Support</h3>
          <div className="bg-[#212121] rounded-[24px] overflow-hidden border border-white/[0.02]">
            <button
              onClick={() => onOpenContent('Help Center', undefined, faqs)}
              className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                <HelpCircle className="text-[#FFD500] w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-white">Help Center</p>
                <p className="text-[11px] text-[#666666] font-medium mt-0.5">FAQs and support</p>
              </div>
              <ChevronRight className="text-[#333333] w-5 h-5" />
            </button>

            <div className="h-px bg-[#333333] ml-16" />

            <button
              onClick={() => onOpenContent('Terms & Conditions', termsOfService)}
              className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                <FileText className="text-[#FFD500] w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-white">Terms & Conditions</p>
              </div>
              <ChevronRight className="text-[#333333] w-5 h-5" />
            </button>

            <div className="h-px bg-[#333333] ml-16" />

            <button
              onClick={() => onOpenContent('Privacy Policy', privacyPolicy)}
              className="w-full flex items-center gap-4 p-5 active:bg-white/5 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center">
                <ShieldCheck className="text-[#FFD500] w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-white">Privacy Policy</p>
              </div>
              <ChevronRight className="text-[#333333] w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
