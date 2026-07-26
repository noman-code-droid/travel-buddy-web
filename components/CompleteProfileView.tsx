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
        <div className="w-[85px] h-[85px] bg-[#FFD500] rounded-[28px] flex items-center justify-center mb-8">
          <User className="text-black w-[44px] h-[44px]" />
        </div>

        <h2 className="text-[28px] font-black text-white italic uppercase tracking-tighter text-center leading-tight">
          COMPLETE PROFILE
        </h2>

        <p className="text-[#ABABAB] text-[14px] mt-4 text-center leading-relaxed max-w-[280px]">
          Almost there! Please enter your phone number to continue. This is required for ride coordination.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[12px] font-bold text-[#ABABAB] uppercase ml-1 tracking-tight">Phone Number</label>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[20px] px-5 py-5 flex items-center gap-4 focus-within:border-[#FFD500] transition-all">
            <Phone className="w-6 h-6 text-[#ABABAB]" />
            <input
              type="tel"
              placeholder="0300 1234567"
              value={phone}
              onChange={handlePhoneChange}
              className="bg-transparent outline-none text-white text-[18px] w-full placeholder:text-[#333333] font-medium"
              required
            />
          </div>
          <p className="text-[10px] text-[#666666] font-bold uppercase tracking-[0.05em] ml-1">
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

        <div className="bg-[#1A1A1A] p-6 rounded-[32px] border border-white/[0.03] flex gap-5 items-center">
          <div className="w-12 h-12 bg-[#22C55E10] rounded-2xl flex items-center justify-center shrink-0 border border-[#22C55E15]">
            <div className="w-6 h-6 rounded-full bg-[#22C55E20] flex items-center justify-center">
                <CheckCircle2 className="text-[#22C55E] w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[14px] text-white font-black uppercase tracking-tight">SECURITY CHECK</p>
            <p className="text-[11px] text-[#888888] leading-snug font-medium">
              Your contact details are encrypted and only shared with verified partners after a ride is confirmed.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="mt-8 !h-[76px] !rounded-full font-black text-[20px] uppercase tracking-[0.15em] shadow-2xl active:scale-[0.98]"
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
