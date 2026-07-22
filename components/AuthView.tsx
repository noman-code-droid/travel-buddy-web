'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

interface AuthViewProps {
  onAuthSuccess: () => void;
}

export default function AuthView({ onAuthSuccess }: AuthViewProps) {
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
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // Note: You might want to update the profile name here as well
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
      <div className="flex flex-col items-center mt-12 mb-8">
        <div className="w-[80px] h-[80px] bg-[#FFD500] rounded-full flex items-center justify-center mb-4">
          <User className="text-black w-[48px] h-[48px]" />
        </div>
        <h2 className="text-[24px] font-bold text-white">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-[#ABABAB] text-[16px] mt-1 text-center">
          {mode === 'login' ? 'Enter your details to sign in' : 'Join the community of travelers'}
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
          label="Email"
          icon={<Mail className="w-5 h-5" />}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
          />
          <button
            type="button"
            className="absolute right-4 top-[46px]" // Adjusted for label height
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5 text-[#ABABAB]" /> : <Eye className="w-5 h-5 text-[#ABABAB]" />}
          </button>
        </div>

        {error && <p className="text-[#E46767] text-xs text-center">{error}</p>}

        {mode === 'login' && (
          <div className="flex justify-between items-center px-1">
             <div className="flex items-center gap-2">
               <input type="checkbox" className="accent-[#FFD500] w-4 h-4" />
               <span className="text-[14px] text-[#ABABAB]">Remember Me</span>
             </div>
            <button type="button" className="text-[#FFD500] text-[14px] font-bold">Forgot Password?</button>
          </div>
        )}

        <Button type="submit" loading={loading} className="mt-4">
          {mode === 'login' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-4 py-2">
          <div className="h-px bg-[#333333] flex-1" />
          <span className="text-[#666666] text-[14px]">OR</span>
          <div className="h-px bg-[#333333] flex-1" />
        </div>

        <Button variant="secondary" onClick={handleGoogleAuth} loading={loading}>
          <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
          <span className="text-[18px] font-bold">Continue with Google</span>
        </Button>
      </div>

      <div className="flex justify-center mt-auto py-6">
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-[16px]"
        >
          <span className="text-[#ABABAB]">{mode === 'login' ? "New Here?" : "Already have an account?"}</span>
          <span className="text-[#FFD500] font-bold ml-1">{mode === 'login' ? ' Register' : ' Login'}</span>
        </button>
      </div>
    </motion.div>
  );
}
