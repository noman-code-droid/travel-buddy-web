'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification } from 'firebase/auth';

interface AuthViewProps {
  onAuthSuccess: () => void;
  openForgetPassword: () => void;
}

export default function AuthView({ onAuthSuccess, openForgetPassword }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          // Logic handled by useAppViewModel based on auth state
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black flex flex-col p-6 overflow-y-auto"
    >
      {/* Header Section - Matches cvLogo, tvWelcome, tvEnterDetails in Android XML */}
      <div className="flex flex-col items-center mt-[60px] mb-8">
        <div className="w-[80px] h-[80px] bg-[#FFD500] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#FFD500]/10">
          <User className="text-black w-[48px] h-[48px]" />
        </div>
        <h2 className="text-[24px] font-bold text-white tracking-tight">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-[#ABABAB] text-[16px] mt-1 text-center font-medium leading-tight max-w-[240px]">
          {mode === 'login' ? 'Enter your details to sign in' : 'Join the community of travelers'}
        </p>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-3">
        {mode === 'signup' && (
          <Input
            label="Full Name"
            icon={<User className="w-5 h-5" />}
            placeholder="Noman Ashraf"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="!bg-[#212121] !border-[#333333]"
          />
        )}

        <Input
          label="Email"
          icon={<Mail className="w-5 h-5" />}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="!bg-[#212121] !border-[#333333]"
        />

        <div className="relative">
          <Input
            label="Password"
            icon={<Lock className="w-5 h-5" />}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="!bg-[#212121] !border-[#333333]"
          />
          <button
            type="button"
            className="absolute right-5 top-[44px]"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5 text-[#666666]" /> : <Eye className="w-5 h-5 text-[#666666]" />}
          </button>
        </div>

        {error && <p className="text-[#E46767] text-[12px] text-center font-medium py-1 leading-tight">{error}</p>}

        {mode === 'login' && (
          <div className="flex justify-between items-center px-1 pt-1">
             <div className="flex items-center gap-2">
               <input type="checkbox" className="accent-[#FFD500] w-4 h-4 rounded border-[#333333] bg-[#212121]" />
               <span className="text-[14px] text-[#ABABAB] font-medium">Remember Me</span>
             </div>
            <button
              type="button"
              onClick={openForgetPassword}
              className="text-[#FFD500] text-[14px] font-bold active:opacity-70 transition-opacity"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div className="pt-4">
          <Button type="submit" loading={loading} className="android-btn-primary !h-[64px]">
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </Button>
        </div>
      </form>

      {/* Divider - Matches dividerLayout in Android XML */}
      <div className="mt-8 mb-6">
        <div className="flex items-center gap-4 py-2">
          <div className="h-px bg-[#333333] flex-1" />
          <span className="text-[#666666] text-[12px] font-black tracking-widest uppercase">OR</span>
          <div className="h-px bg-[#333333] flex-1" />
        </div>

        {/* Google Button - Matches btnSignInWithGoogle in Android XML */}
        <Button
          variant="secondary"
          onClick={handleGoogleAuth}
          loading={loading}
          className="android-btn-secondary !bg-[#212121] !border-[#333333] !rounded-[24px] !h-[64px]"
        >
          <img src="https://www.google.com/favicon.ico" className="w-6 h-6 grayscale opacity-80" alt="Google" />
          <span className="text-[18px] font-bold tracking-tight">Continue with Google</span>
        </Button>
      </div>

      {/* Footer Layout - Matches footerLayout in Android XML */}
      <div className="flex justify-center mt-auto py-8">
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-[16px] transition-transform active:scale-95"
        >
          <span className="text-[#ABABAB] font-medium">{mode === 'login' ? "New Here?" : "Already have an account?"}</span>
          <span className="text-[#FFD500] font-bold ml-1">{mode === 'login' ? ' Register' : ' Login'}</span>
        </button>
      </div>
    </motion.div>
  );
}
