'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, CheckCircle2 } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ForgetPasswordViewProps {
  onClose: () => void;
}

export default function ForgetPasswordView({ onClose }: ForgetPasswordViewProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black flex flex-col p-6 z-[100] overflow-y-auto"
    >
      <div className="flex items-center mt-4">
        <button onClick={onClose} className="p-2 -ml-2 active:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="text-white w-7 h-7 rotate-180" />
        </button>
      </div>

      <div className="flex flex-col items-center mt-12 mb-8 text-center">
        <div className="w-[80px] h-[80px] bg-[#FFD500] rounded-full flex items-center justify-center mb-6 shadow-lg">
          <Lock className="text-black w-[40px] h-[40px]" />
        </div>
        <h2 className="text-[24px] font-bold text-white tracking-tight italic uppercase">Forgot Password</h2>
        <p className="text-[#ABABAB] text-[16px] mt-2 max-w-[280px]">
          Enter your email to receive a secure password reset link.
        </p>
      </div>

      {sent ? (
        <div className="flex flex-col items-center py-10 space-y-6">
           <div className="bg-[#22C55E10] p-6 rounded-[32px] border border-[#22C55E20]">
             <CheckCircle2 className="text-[#22C55E] w-12 h-12" />
           </div>
           <p className="text-white font-bold text-center leading-relaxed">
             Reset link has been sent to <br/>
             <span className="text-[#FFD500]">{email}</span>
           </p>
           <Button onClick={onClose} className="w-full !rounded-[24px]">Back to Login</Button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-6">
          <Input
            label="Email Address"
            icon={<Mail className="w-5 h-5" />}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="text-[#E46767] text-[12px] text-center font-medium">{error}</p>}

          <div className="pt-4">
            <Button type="submit" loading={loading} className="android-btn-primary">
              Send Reset Link
            </Button>
          </div>
        </form>
      )}

      <div className="mt-auto py-8 text-center">
        <p className="text-[11px] text-[#222222] font-black uppercase tracking-[0.4em]">Travel Buddy Security Protocol</p>
      </div>
    </motion.div>
  );
}
