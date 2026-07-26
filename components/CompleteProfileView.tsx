'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, User, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
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
    // Only allow numbers and the plus sign
    const val = e.target.value.replace(/[^\d+]/g, '');

    // Pakistani mobile numbers are typically:
    // 03xxxxxxxxx (11 digits)
    // 923xxxxxxxxx (12 digits)
    // +923xxxxxxxxx (13 characters)
    if (val.length <= 13) {
      setPhone(val);
      if (error) setError('');
    }
  };

  const validatePakistaniNumber = (num: string) => {
    // Basic cleaning: remove any whitespace
    const cleaned = num.trim();

    // Regex for Pakistani Mobile Numbers:
    // 1. Starts with 03 and has 9 more digits (total 11)
    // 2. Starts with 923 and has 9 more digits (total 12)
    // 3. Starts with +923 and has 9 more digits (total 13)
    const pkPhoneRegex = /^((\+92)|(92)|(0))3\d{9}$/;
    return pkPhoneRegex.test(cleaned);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (!validatePakistaniNumber(phone)) {
      setError('Please enter a valid Pakistani mobile number (e.g., 0300 1234567)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Standardize the phone number for the database (optional, but good practice)
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
      console.error("Save Profile Error:", err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black flex flex-col p-6 z-[80] overflow-y-auto"
    >
      <div className="flex flex-col items-center mt-12 mb-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-[80px] h-[80px] bg-[#FFD500] rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,213,0,0.2)]"
        >
          <User className="text-black w-[40px] h-[40px]" />
        </motion.div>
        <h2 className="text-[28px] font-black text-white italic tracking-tighter uppercase text-center">Complete Profile</h2>
        <p className="text-[#ABABAB] text-[15px] mt-2 text-center leading-relaxed max-w-[280px]">
          Almost there! Please enter your phone number to continue. This is required for ride coordination.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <Input
            label="Phone Number"
            icon={<Phone className="w-5 h-5" />}
            placeholder="0300 1234567"
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            error={error}
            required
            className="!bg-[#111111] border-[#333333] focus-within:border-[#FFD500]"
          />
          <p className="text-[10px] text-[#666666] font-bold uppercase tracking-widest ml-1">
            Format: 03xx-xxxxxxx or +923xx-xxxxxxx
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-[#E46767] bg-[#E4676710] p-4 rounded-2xl border border-[#E4676720]"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-[11px] font-bold uppercase tracking-tight leading-tight">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[#212121] p-5 rounded-[24px] border border-white/5 flex gap-4 items-start shadow-inner">
          <div className="p-2 bg-[#22C55E20] rounded-xl">
            <CheckCircle2 className="text-[#22C55E] w-5 h-5 shrink-0" />
          </div>
          <div className="space-y-1">
            <p className="text-[12px] text-white font-bold uppercase tracking-tight">Security Check</p>
            <p className="text-[10px] text-[#888888] leading-relaxed font-medium">
              Your contact details are encrypted and only shared with verified partners after a ride is confirmed.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="mt-8 !h-[72px] !rounded-[24px] font-black text-[18px] uppercase tracking-[0.2em] shadow-xl shadow-yellow-500/10 active:scale-[0.98]"
        >
          Save & Continue
        </Button>
      </form>

      <div className="mt-auto py-8 text-center">
        <p className="text-[10px] text-[#333333] font-black uppercase tracking-[0.3em]">
          Travel Buddy Identity Protection v1.0
        </p>
      </div>
    </motion.div>
  );
}
