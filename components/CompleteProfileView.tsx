'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from './ui/Button';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface CompleteProfileViewProps {
  onComplete: () => void;
}

export default function CompleteProfileView({ onComplete }: CompleteProfileViewProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d+]/g, '');
    if (val.length <= 13) {
      setPhone(val);
      if (error) setError('');
    }
  };

  const validatePakistaniNumber = (num: string) => {
    const cleaned = num.trim();
    const pkPhoneRegex = /^((\+92)|(92)|(0))3\d{9}$/;
    return pkPhoneRegex.test(cleaned);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (!validatePakistaniNumber(phone)) {
      setError('PLEASE ENTER A VALID PAKISTANI NUMBER');
      return;
    }

    setLoading(true);
    setError('');
    try {
      let standardizedPhone = phone.trim();
      if (standardizedPhone.startsWith('03')) {
        standardizedPhone = '92' + standardizedPhone.substring(1);
      } else if (standardizedPhone.startsWith('+')) {
        standardizedPhone = standardizedPhone.substring(1);
      }

      await setDoc(doc(db, "users", auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'User',
        email: auth.currentUser.email,
        phone: standardizedPhone,
        photoUrl: auth.currentUser.photoURL || '',
        isProfileComplete: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      onComplete();
    } catch (err: any) {
      setError(err.message?.toUpperCase() || 'FAILED TO SAVE PROFILE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black flex flex-col p-8 z-[80] overflow-y-auto"
    >
      <div className="flex flex-col items-center mt-12 mb-10">
        {/* Yellow Icon - Exact Squircle */}
        <div className="w-[90px] h-[90px] bg-[#FFD500] rounded-[24px] flex items-center justify-center mb-10 shadow-[0_10px_30px_rgba(255,213,0,0.15)]">
          <User className="text-black w-[48px] h-[48px]" />
        </div>

        {/* Title - Bold Italic Uppercase Tighter */}
        <h2 className="text-[32px] font-black text-white italic uppercase tracking-tighter text-center leading-[0.9] mb-4">
          COMPLETE PROFILE
        </h2>

        {/* Description - Focused Width */}
        <p className="text-[#888888] text-[15px] text-center leading-[1.4] max-w-[280px]">
          Almost there! Please enter your phone number to continue. This is required for ride coordination.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="space-y-3">
          {/* Input Label - Grey Caps */}
          <label className="text-[12px] font-bold text-[#666666] uppercase ml-1 tracking-widest">PHONE NUMBER</label>

          {/* Input Box - Dark Grey, Deep Rounded */}
          <div className="bg-[#151515] border border-[#222222] rounded-[24px] px-6 py-6 flex items-center gap-4 focus-within:border-[#FFD500] transition-all">
            <Phone className="w-6 h-6 text-[#666666]" />
            <input
              type="tel"
              placeholder="0300 1234567"
              value={phone}
              onChange={handlePhoneChange}
              className="bg-transparent outline-none text-white text-[18px] w-full placeholder:text-[#333333] font-bold"
              required
            />
          </div>

          <p className="text-[10px] text-[#444444] font-black uppercase tracking-[0.1em] ml-1">
            FORMAT: 03XX-XXXXXXX OR +923XX-XXXXXXX
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-[#E46767] bg-[#E4676708] p-4 rounded-2xl border border-[#E4676715]"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Card - Pixel Perfect to Screenshot */}
        <div className="bg-[#151515] p-7 rounded-[32px] border border-white/[0.03] flex gap-5 items-center">
          <div className="w-12 h-12 bg-[#22C55E10] rounded-2xl flex items-center justify-center shrink-0 border border-[#22C55E15]">
            <CheckCircle2 className="text-[#22C55E] w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[14px] text-white font-black uppercase tracking-tight">SECURITY CHECK</p>
            <p className="text-[11px] text-[#777777] leading-tight font-medium">
              Your contact details are encrypted and only shared with verified partners after a ride is confirmed.
            </p>
          </div>
        </div>

        {/* Action Button - Large Yellow Pill */}
        <Button
          type="submit"
          loading={loading}
          className="mt-6 !h-[80px] !rounded-full font-black text-[22px] uppercase tracking-[0.1em] shadow-[0_20px_40px_rgba(255,213,0,0.15)] active:scale-[0.98]"
        >
          SAVE & CONTINUE
        </Button>
      </form>

      <div className="mt-auto pt-16 pb-6 text-center">
        <p className="text-[11px] text-[#333333] font-black uppercase tracking-[0.5em]">
          TRAVEL BUDDY IDENTITY PROTECTION V1.0
        </p>
      </div>
    </motion.div>
  );
}
