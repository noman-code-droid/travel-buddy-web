'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Upload,
  Clock,
  FileCheck,
  Loader2,
  AlertCircle,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import MediaPickerDialog from './ui/MediaPickerDialog';
import PhotoConfirmDialog from './ui/PhotoConfirmDialog';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface DriverRegistrationViewProps {
  onClose: () => void;
  status: 'none' | 'pending' | 'approved' | 'rejected';
}

export default function DriverRegistrationView({ onClose, status }: DriverRegistrationViewProps) {
  const [step, setStep] = useState(status === 'none' || status === 'rejected' ? 1 : 4);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Document states
  const [licenseFront, setLicenseFront] = useState<string | null>(null);
  const [licenseBack, setLicenseBack] = useState<string | null>(null);
  const [cnicFront, setCnicFront] = useState<string | null>(null);

  // Dialog states
  const [activePicker, setActivePicker] = useState<'licenseFront' | 'licenseBack' | 'cnicFront' | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{ url: string, file: File } | null>(null);

  const [formData, setFormData] = useState({
    vehicleMake: '',
    vehicleModel: '',
    registrationNumber: '',
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => step > 1 ? setStep(prev => prev - 1) : onClose();

  // Mock upload logic (replace with real Vercel Blob/Firebase Storage)
  const uploadFile = async (dataUrl: string) => {
    return dataUrl; // Placeholder
  };

  const onMediaSelect = (source: 'camera' | 'gallery') => {
    // In a real PWA/Web app, this would trigger the system camera or file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.setAttribute('capture', 'environment');

    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setPendingPhoto({ url, file });
      }
    };
    input.click();
    setActivePicker(null);
  };

  const confirmPhoto = () => {
    if (!pendingPhoto || !activePicker) return;
    if (activePicker === 'licenseFront') setLicenseFront(pendingPhoto.url);
    if (activePicker === 'licenseBack') setLicenseBack(pendingPhoto.url);
    if (activePicker === 'cnicFront') setCnicFront(pendingPhoto.url);
    setPendingPhoto(null);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        ...formData,
        licenseFront,
        licenseBack,
        cnicFront,
        verificationStatus: 'pending',
        isDriverApplied: true,
        appliedAt: serverTimestamp()
      });
      setStep(4);
    } catch (error) {
      alert("Registration failed");
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
          {step === 4 ? 'Status' : 'Driver Registration'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-black no-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Vehicle Details</h3>
                <p className="text-[#666666] text-sm font-medium">Please provide your car information.</p>
              </div>
              <div className="space-y-4">
                <Input label="Vehicle Make" placeholder="e.g. Honda" value={formData.vehicleMake} onChange={e => setFormData({...formData, vehicleMake: e.target.value})} />
                <Input label="Vehicle Model" placeholder="e.g. Civic" value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})} />
                <Input label="Registration Number" placeholder="e.g. LEA-1234" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
              </div>
              <Button onClick={handleNext} disabled={!formData.vehicleMake || !formData.vehicleModel || !formData.registrationNumber} className="mt-8">
                Continue <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Document Upload</h3>
                <p className="text-[#666666] text-sm font-medium">Upload clear photos of your official documents.</p>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  { id: 'licenseFront', label: 'License (Front)', value: licenseFront },
                  { id: 'licenseBack', label: 'License (Back)', value: licenseBack },
                  { id: 'cnicFront', label: 'CNIC (Front)', value: cnicFront },
                ].map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setActivePicker(doc.id as any)}
                    className="w-full text-left"
                  >
                    <div className={`android-card p-5 border flex items-center justify-between transition-all ${doc.value ? 'bg-[#FFD50010] border-[#FFD50030]' : 'border-white/[0.05]'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${doc.value ? 'bg-[#FFD500] shadow-lg' : 'bg-black border border-white/5'}`}>
                          {doc.value ? (
                            <CheckCircle2 className="text-black w-6 h-6" />
                          ) : (
                            <Upload className="text-[#666666] w-6 h-6" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[15px] font-bold text-white">{doc.label}</p>
                          <p className={`text-[11px] font-black uppercase tracking-widest ${doc.value ? 'text-[#FFD500]' : 'text-[#444444]'}`}>
                            {doc.value ? 'Photo Captured' : 'Upload Required'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#333333]" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-[#1A1A1A] p-5 rounded-[24px] border border-white/[0.03] flex gap-4 items-center mt-4">
                <div className="w-10 h-10 bg-[#FFD50010] rounded-xl flex items-center justify-center shrink-0 border border-[#FFD50015]">
                    <ShieldCheck className="text-[#FFD500] w-6 h-6" />
                </div>
                <p className="text-[11px] text-[#777777] leading-tight font-medium">
                  Ensure documents are well-lit and all text is clearly readable for faster verification.
                </p>
              </div>

              <Button
                onClick={handleNext}
                disabled={!licenseFront || !licenseBack || !cnicFront}
                className="mt-6"
              >
                Review Application
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white uppercase italic tracking-tighter">Review & Submit</h3>
                <p className="text-[#666666] text-sm font-medium">Final check before broadcasting to admin.</p>
              </div>

              <div className="android-card-elevated p-6 space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-[#666666] uppercase tracking-[0.2em]">Vehicle</span>
                    <span className="text-xs font-bold text-[#FFD500]">VERIFIED</span>
                 </div>
                 <p className="text-[16px] font-bold text-white uppercase tracking-tight">{formData.vehicleMake} {formData.vehicleModel}</p>

                 <div className="h-px bg-white/5" />

                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-[#666666] uppercase tracking-[0.2em]">Documents</span>
                    <span className="text-xs font-bold text-[#FFD500]">3 FILES</span>
                 </div>
                 <div className="flex gap-2">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="w-10 h-10 bg-black rounded-lg border border-white/5 flex items-center justify-center">
                       <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                     </div>
                   ))}
                 </div>
              </div>

              <div className="pt-4 space-y-4">
                <Button onClick={handleSubmit} loading={loading} className="android-btn-primary">
                  Submit for Review
                </Button>
                <p className="text-center text-[10px] font-black text-[#333333] uppercase tracking-[0.4em]">Protocol V2.1 Encryption</p>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="status" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center space-y-8 pt-10">
              <div className="w-[100px] h-[100px] bg-[#FFD50010] rounded-full flex items-center justify-center border-2 border-[#FFD50020] shadow-xl">
                <Clock className="w-12 h-12 text-[#FFD500] animate-pulse" />
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Review in Progress</h3>
                <p className="text-[#ABABAB] text-sm leading-relaxed max-w-[260px]">
                  Our security team is reviewing your documents. This usually takes up to **24 hours**.
                </p>
              </div>

              <div className="android-card-elevated p-6 w-full text-left">
                <p className="text-[11px] text-[#666666] font-bold uppercase tracking-widest mb-2">Next Steps</p>
                <p className="text-[13px] text-[#888888] leading-tight">
                  You will be notified once your account is approved. You can then start accepting rides!
                </p>
              </div>

              <Button onClick={onClose} variant="secondary" className="mt-8 !rounded-full">Back to Dashboard</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Media Picker Dialog */}
      <MediaPickerDialog
        isOpen={!!activePicker}
        onClose={() => setActivePicker(null)}
        onSelect={onMediaSelect}
      />

      {/* Photo Confirmation Dialog */}
      <PhotoConfirmDialog
        isOpen={!!pendingPhoto}
        onClose={() => setPendingPhoto(null)}
        photoUrl={pendingPhoto?.url || ''}
        onConfirm={confirmPhoto}
        onRetake={() => {
          setPendingPhoto(null);
          // Re-open picker if retaking
        }}
      />
    </motion.div>
  );
}
