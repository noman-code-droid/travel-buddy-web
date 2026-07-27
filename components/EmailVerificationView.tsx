'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import Button from './ui/Button';
import { auth } from '@/lib/firebase';
import { sendEmailVerification, reload } from 'firebase/auth';

interface EmailVerificationViewProps {
  onVerified: () => void;
  onBackToLogin: () => void;
}

export default function EmailVerificationView({ onVerified, onBackToLogin }: EmailVerificationViewProps) {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const checkVerification = async () => {
    setLoading(true);
    setError('');
    try {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          onVerified();
        } else {
          setError('Email not verified yet. Please check your inbox.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check verification status');
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      alert('Verification email sent!');
    } catch (err: any) {
      alert(err.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black flex flex-col p-8 z-[100] overflow-y-auto"
    >
      <div className="flex flex-col items-center mt-12 mb-10 text-center">
        <div className="w-[120px] h-[120px] bg-[#FFD50010] rounded-full flex items-center justify-center mb-8 border border-[#FFD50020]">
          <Mail className="text-[#FFD500] w-[60px] h-[60px]" />
        </div>

        <h2 className="text-[32px] font-black text-white italic uppercase tracking-tighter leading-[0.9] mb-6">
          VERIFY YOUR EMAIL
        </h2>

        <p className="text-[#888888] text-[16px] leading-relaxed max-w-[280px]">
          We've sent a verification link to your email address. Please click the link to continue.
        </p>
      </div>

      <div className="space-y-6">
        <Button
          onClick={checkVerification}
          loading={loading}
          className="android-btn-primary !h-[72px]"
        >
          I've Verified, Continue
        </Button>

        <div className="flex flex-col items-center gap-2 pt-4">
          <p className="text-[14px] text-[#666666] font-medium">Didn't receive the email?</p>
          <button
            onClick={resendEmail}
            disabled={resending}
            className="text-[#FFD500] font-black uppercase tracking-widest text-[14px] flex items-center gap-2 active:scale-95 transition-transform"
          >
            {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Resend Link
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center mt-4">
            <p className="text-[#E46767] text-[12px] font-bold uppercase tracking-tight">{error}</p>
          </div>
        )}
      </div>

      <div className="mt-auto py-8 flex justify-center">
        <button
          onClick={onBackToLogin}
          className="text-[#666666] font-bold text-[16px] p-2 hover:text-white transition-colors"
        >
          Back to Login
        </button>
      </div>
    </motion.div>
  );
}
