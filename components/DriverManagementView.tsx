'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Headset,
  CheckCircle2,
  Info,
  ChevronRight,
  ShieldCheck,
  Star,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

interface DriverManagementViewProps {
  onClose: () => void;
  onApply: () => void;
  onAppeal: () => void;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export default function DriverManagementView({ onClose, onApply, onAppeal, status, rejectionReason }: DriverManagementViewProps) {
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[70] flex flex-col"
    >
      {/* Header - Matches activity_driver_management.xml */}
      <div className="p-4 flex items-center justify-between border-b border-[#333333] bg-black sticky top-0 z-10">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center active:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="text-white w-7 h-7 rotate-180" />
        </button>
        <h2 className="text-[20px] font-bold text-white flex-1 text-center pr-10">
          {isPending || isRejected ? 'Application Status' : 'Become a Driver'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-10 no-scrollbar">

        {/* Status Card - Matches activity_driver_management.xml status logic */}
        {(isPending || isRejected) && (
          <div className="android-card-elevated p-8 flex flex-col items-center text-center space-y-6 bg-[#1A1A1A] border border-white/[0.03]">
            <div className={`w-[80px] h-[80px] rounded-[28px] flex items-center justify-center shadow-lg ${isRejected ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#FFD50010] border border-[#FFD50020]'}`}>
              {isRejected ? (
                <AlertCircle className="text-[#E46767] w-10 h-10" />
              ) : (
                <Clock className="text-[#FFD500] w-10 h-10 animate-pulse" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className={`text-[22px] font-black italic uppercase tracking-tighter ${isRejected ? 'text-[#E46767]' : 'text-white'}`}>
                {isRejected ? 'Verification Rejected' : 'Review in Progress'}
              </h3>
              <p className="text-[14px] text-[#666666] font-medium max-w-[240px]">
                {isRejected
                  ? 'Unfortunately, your application was not approved.'
                  : 'Our security team is currently reviewing your documents.'}
              </p>
            </div>

            {isRejected && rejectionReason && (
              <div className="w-full bg-red-500/5 border border-red-500/10 p-4 rounded-2xl flex gap-3 items-start text-left">
                <Info className="w-4 h-4 text-[#E46767] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#E46767] font-medium">Reason: {rejectionReason}</p>
              </div>
            )}

            <div className="w-full space-y-3 pt-2">
              {isRejected ? (
                <>
                  <Button onClick={onAppeal} className="android-btn-primary !h-[60px]">
                    Appeal Decision
                  </Button>
                  <Button onClick={onApply} variant="secondary" className="!h-[60px]">
                    Re-apply (Update Data)
                  </Button>
                </>
              ) : (
                <div className="bg-[#FFD50008] p-4 rounded-2xl border border-[#FFD50010]">
                  <p className="text-[11px] text-[#666666] font-bold uppercase tracking-[0.2em]">
                    Estimated Wait: 24 Hours
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isPending && !isRejected && (
          <>
            {/* Hero Section */}
            <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#FFD500] to-[#EAB308] p-8 text-black shadow-xl">
              <div className="relative z-10 space-y-2">
                <h1 className="text-[28px] font-black italic uppercase tracking-tighter leading-none">Start Earning Today</h1>
                <p className="text-[14px] font-bold opacity-80 leading-tight max-w-[200px]">
                  Share your rides and earn money while traveling your usual routes.
                </p>
              </div>

              <div className="mt-8 flex justify-between items-center border-t border-black/10 pt-6">
                 <div>
                   <p className="text-[20px] font-black italic tracking-tighter">PKR 500+</p>
                   <p className="text-[10px] font-bold uppercase opacity-60">Avg. Monthly</p>
                 </div>
                 <div className="w-px h-8 bg-black/10" />
                 <div className="text-center">
                   <p className="text-[20px] font-black italic tracking-tighter">4.8★</p>
                   <p className="text-[10px] font-bold uppercase opacity-60">Avg. Rating</p>
                 </div>
                 <div className="w-px h-8 bg-black/10" />
                 <div className="text-right">
                   <p className="text-[20px] font-black italic tracking-tighter">10k+</p>
                   <p className="text-[10px] font-bold uppercase opacity-60">Drivers</p>
                 </div>
              </div>
            </div>

            {/* Requirements Section */}
            <div className="space-y-4">
              <h3 className="text-[14px] font-black text-[#666666] uppercase tracking-[0.2em] ml-2">Requirements</h3>
              <div className="bg-[#1A1A1A] rounded-[24px] p-6 space-y-4 border border-white/[0.03]">
                {[
                  "Valid Driver's License",
                  "CNIC (Identity Card)",
                  "Clear Profile Photo"
                ].map((req, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <CheckCircle2 className="w-5 h-5 text-[#FFD500]" />
                    <span className="text-[15px] font-bold text-white/90">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="space-y-4">
              <h3 className="text-[14px] font-black text-[#666666] uppercase tracking-[0.2em] ml-2">Driver Benefits</h3>
              <div className="space-y-3">
                {[
                  { icon: DollarSign, title: "Flexible Earnings", desc: "Set your own schedule and prices" },
                  { icon: Calendar, title: "Financial Reports", desc: "See your earnings in real-time" },
                  { icon: Headset, title: "Premium Support", desc: "24/7 driver assistance" }
                ].map((benefit, i) => (
                  <div key={i} className="bg-[#1A1A1A] rounded-[24px] p-5 flex items-center gap-5 border border-white/[0.02]">
                    <div className="w-14 h-14 bg-[#FFD500] rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                      <benefit.icon className="text-black w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-[16px] text-white uppercase tracking-tight">{benefit.title}</h4>
                      <p className="text-[12px] text-[#666666] font-medium leading-tight">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-4">
              <Button
                onClick={onApply}
                className="android-btn-primary !h-[72px] !rounded-[36px] shadow-xl shadow-[#FFD500]/10"
              >
                Apply to Become a Driver
              </Button>
            </div>
          </>
        )}

      </div>
    </motion.div>
  );
}
