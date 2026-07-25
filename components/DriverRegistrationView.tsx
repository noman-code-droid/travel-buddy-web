'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Camera,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Upload,
  Clock
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface DriverRegistrationViewProps {
  onClose: () => void;
  status: 'none' | 'pending' | 'approved' | 'rejected';
}

export default function DriverRegistrationView({ onClose, status }: DriverRegistrationViewProps) {
  const [step, setStep] = useState(status === 'none' || status === 'rejected' ? 1 : 4);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleMake: '',
    vehicleModel: '',
    registrationNumber: '',
    licenseNumber: '',
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => step > 1 ? setStep(prev => prev - 1) : onClose();

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        ...formData,
        verificationStatus: 'pending',
        isDriverApplied: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStep(4);
    } catch (error) {
      alert("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      <div className="p-4 flex items-center gap-4 border-b border-[#333333] bg-black z-10">
        <button onClick={handlePrev} disabled={loading}>
          <ArrowLeft className="text-white w-7 h-7" />
        </button>
        <h2 className="font-bold text-[20px] flex-1 text-center mr-7 text-white">
          {step === 4 ? 'Verification Status' : 'Driver Registration'}
        </h2>
      </div>

      {step < 4 && (
        <div className="w-full h-1 bg-[#212121]">
          <motion.div
            className="h-full bg-[#FFD500]"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 bg-black">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Vehicle Details</h3>
                <p className="text-[#ABABAB] text-sm">Tell us about the car you'll be driving.</p>
              </div>
              <div className="space-y-4">
                <Input label="Vehicle Make" placeholder="e.g. Honda, Toyota" value={formData.vehicleMake} onChange={e => setFormData({...formData, vehicleMake: e.target.value})} />
                <Input label="Vehicle Model" placeholder="e.g. Civic, Corolla" value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})} />
                <Input label="Registration Number" placeholder="e.g. LEA-1234" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
              </div>
              <Button onClick={handleNext} disabled={!formData.vehicleMake || !formData.vehicleModel || !formData.registrationNumber} className="mt-8">
                Next <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">License Information</h3>
                <p className="text-[#ABABAB] text-sm">Upload your driving license details.</p>
              </div>
              <Input label="License Number" placeholder="e.g. PB-12345678" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} />

              <div className="grid grid-cols-1 gap-4 pt-4">
                <Card variant="flat" className="p-8 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer active:bg-white/5">
                  <Upload className="w-8 h-8 text-[#FFD500]" />
                  <span className="text-xs font-bold text-[#ABABAB] uppercase">Upload License Front</span>
                </Card>
                <Card variant="flat" className="p-8 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer active:bg-white/5">
                  <Upload className="w-8 h-8 text-[#FFD500]" />
                  <span className="text-xs font-bold text-[#ABABAB] uppercase">Upload License Back</span>
                </Card>
              </div>
              <Button onClick={handleNext} disabled={!formData.licenseNumber} className="mt-8">
                Next <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 flex flex-col items-center text-center">
              <div className="space-y-2 w-full text-left">
                <h3 className="text-2xl font-bold text-white">Identity Verification</h3>
                <p className="text-[#ABABAB] text-sm">Take a clear photo of yourself.</p>
              </div>

              <div className="w-48 h-48 bg-[#212121] rounded-full border-4 border-[#333333] flex items-center justify-center relative overflow-hidden group active:border-[#FFD500] transition-colors">
                <Camera className="w-12 h-12 text-[#333333] group-active:text-[#FFD500]" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">Open Camera</span>
                </div>
              </div>

              <div className="bg-[#FFD50010] p-4 rounded-2xl border border-[#FFD50030] flex gap-3 text-left">
                <ShieldCheck className="w-5 h-5 text-[#FFD500] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#FFD500] leading-relaxed">
                  Your photo will be used for verification and shown to passengers once a ride is booked. Ensure your face is clearly visible.
                </p>
              </div>

              <Button onClick={handleSubmit} loading={loading} className="mt-4 w-full">
                Submit Application
              </Button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="status" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center space-y-8 pt-10">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                status === 'approved' ? 'bg-[#22C55E20] border-[#22C55E]' : 'bg-[#FFD50020] border-[#FFD500]'
              } border-2 shadow-lg`}>
                {status === 'approved' ? (
                  <CheckCircle2 className="w-12 h-12 text-[#22C55E]" />
                ) : (
                  <Clock className="w-12 h-12 text-[#FFD500] animate-pulse" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  {status === 'approved' ? 'Verified Driver' : 'Application Under Review'}
                </h3>
                <p className="text-[#ABABAB] text-sm leading-relaxed max-w-[260px]">
                  {status === 'approved'
                    ? 'Congratulations! You are now a verified Travel Buddy driver. You can start posting rides.'
                    : 'Our team is reviewing your documents. This usually takes 24-48 hours. We will notify you once approved.'}
                </p>
              </div>

              <div className="w-full pt-8">
                <Button onClick={onClose} variant={status === 'approved' ? 'primary' : 'secondary'}>
                  {status === 'approved' ? 'Start Driving' : 'Back to Dashboard'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
