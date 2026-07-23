'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, User, CheckCircle2 } from 'lucide-react';
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (!/^03\d{9}$/.test(phone)) {
      setError('Enter a valid Pakistani number (e.g., 03001234567)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'User',
        email: auth.currentUser.email,
        phone: phone,
        photoUrl: auth.currentUser.photoURL || '',
        isProfileComplete: true,
        verificationStatus: 'none',
        createdAt: serverTimestamp()
      }, { merge: true });

      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute inset-0 bg-black flex flex-col p-8 z-[80]"
    >
      <div className="mt-12 space-y-6">
        <div className="w-20 h-20 bg-[#FFD500] rounded-3xl flex items-center justify-center shadow-lg">
          <User className="text-black w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Complete Profile</h2>
          <p className="text-[#ABABAB] text-sm leading-relaxed">
            Almost there! Please enter your phone number to continue. This is required for ride coordination.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6 pt-4">
          <Input
            label="Phone Number"
            icon={<Phone className="w-5 h-5" />}
            placeholder="03001234567"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={error}
            required
          />

          <div className="bg-[#212121] p-4 rounded-2xl border border-[#333333] flex gap-3 items-start">
            <CheckCircle2 className="text-[#22C55E] w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs text-[#ABABAB]">
              Your number will only be shared with your driver or passenger once a ride is confirmed.
            </p>
          </div>

          <Button type="submit" loading={loading} className="mt-8">
            Save & Continue
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
