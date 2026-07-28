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
          // Logic handled by app/page.tsx
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
      <div className="flex flex-col items-center mt-[60px] mb-8">
        <div className="w-[80px] h-[80px] bg-[#FFD500] rounded-full flex items-center justify-center mb-4 shadow-md border-2 border-black">
          <User className="text-black w-[40px] h-[40px]" />
        </div>
        <h2 className="text-[24px] font-bold text-white tracking-tight">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-[#666666] text-[16px] mt-1 text-center font-medium leading-tight">
          {mode === 'login' ? 'Enter your details to sign in' : 'Join the Travel Buddy community'}
        </p>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        {mode === 'signup' && (
          <Input
            label="Full Name"
            icon={<User className="w-5 h-5" />}
            placeholder="Noman Ashraf"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}

        <Input
          label="Email Address"
          icon={<Mail className="w-5 h-5" />}
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative">
          <Input
            label="Password"
            icon={<Lock className="w-5 h-5" />}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-5 top-[44px] p-2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5 text-[#444444]" /> : <Eye className="w-5 h-5 text-[#444444]" />}
          </button>
        </div>

        {error && <p className="text-[#E46767] text-[12px] font-bold text-center">{error}</p>}

        {mode === 'login' && (
          <div className="flex justify-between items-center px-1">
             <div className="flex items-center gap-2">
               <input type="checkbox" className="accent-[#FFD500] w-4 h-4 rounded border-[#333333] bg-[#212121]" />
               <span className="text-[13px] text-[#666666] font-bold">Remember Me</span>
             </div>
            <button
              type="button"
              onClick={openForgetPassword}
              className="text-[#FFD500] text-[13px] font-bold"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <div className="pt-4">
          <Button type="submit" loading={loading} className="android-btn-primary">
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </Button>
        </div>
      </form>

      <div className="mt-8 mb-6">
        <div className="flex items-center gap-4 py-2 opacity-30">
          <div className="h-px bg-white flex-1" />
          <span className="text-white text-[10px] font-bold">OR</span>
          <div className="h-px bg-white flex-1" />
        </div>

        <Button
          variant="secondary"
          onClick={handleGoogleAuth}
          loading={loading}
          className="!h-[60px] !rounded-[30px]"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5 grayscale opacity-70" alt="G" />
          <span className="text-[16px] font-bold">Continue with Google</span>
        </Button>
      </div>

      <div className="flex justify-center mt-auto py-8">
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-[15px]"
        >
          <span className="text-[#666666]">{mode === 'login' ? "Don't have an account?" : "Already have an account?"}</span>
          <span className="text-[#FFD500] font-bold ml-1">{mode === 'login' ? 'Register' : 'Login'}</span>
        </button>
      </div>
    </motion.div>
  );
}
