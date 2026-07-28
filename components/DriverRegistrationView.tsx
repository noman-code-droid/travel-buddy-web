'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Upload,
  Clock,
  Loader2,
  Camera,
  Image as ImageIcon,
  User
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import MediaPickerDialog from './ui/MediaPickerDialog';
import PhotoConfirmDialog from './ui/PhotoConfirmDialog';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface DriverRegistrationViewProps {
  onClose: () => void;
  status: 'none' | 'pending' | 'approved' | 'rejected';
}

interface PhotoData {
    url: string;
    file: File;
}

export default function DriverRegistrationView({ onClose, status }: DriverRegistrationViewProps) {
  const [step, setStep] = useState(status === 'none' || status === 'rejected' ? 1 : 4);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Local File States (Batch Upload)
  const [licenseFront, setLicenseFront] = useState<PhotoData | null>(null);
  const [licenseBack, setLicenseBack] = useState<PhotoData | null>(null);
  const [cnicFront, setCnicFront] = useState<PhotoData | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<PhotoData | null>(null);

  // Picker States
  const [activePicker, setActivePicker] = useState<'licenseFront' | 'licenseBack' | 'cnicFront' | 'profilePhoto' | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<PhotoData | null>(null);

  const [formData, setFormData] = useState({
    vehicleMake: '',
    vehicleModel: '',
    registrationNumber: '',
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => step > 1 ? setStep(prev => prev - 1) : onClose();

  const onMediaSelect = (source: 'camera' | 'gallery') => {
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
    if (activePicker === 'licenseFront') setLicenseFront(pendingPhoto);
    if (activePicker === 'licenseBack') setLicenseBack(pendingPhoto);
    if (activePicker === 'cnicFront') setCnicFront(pendingPhoto);
    if (activePicker === 'profilePhoto') setProfilePhoto(pendingPhoto);
    setPendingPhoto(null);
    setActivePicker(null);
  };

  const uploadToBlob = async (file: File) => {
    const response = await fetch(`/api/upload?filename=${file.name}`, {
      method: 'POST',
      body: file,
    });
    const blob = await response.json();
    return blob.url;
  };

  const handleSubmit = async () => {
    if (!auth.currentUser || !licenseFront || !licenseBack || !cnicFront || !profilePhoto) return;

    setLoading(true);
    setUploadStatus('Uploading documents...');

    try {
      // BATCH UPLOAD: Upload all files in parallel
      const [lFrontUrl, lBackUrl, cFrontUrl, pPhotoUrl] = await Promise.all([
        uploadToBlob(licenseFront.file),
        uploadToBlob(licenseBack.file),
        uploadToBlob(cnicFront.file),
        uploadToBlob(profilePhoto.file)
      ]);

      setUploadStatus('Finalizing application...');

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        ...formData,
        licenseUrl: lFrontUrl,
        licenseBackUrl: lBackUrl,
        cnicUrl: cFrontUrl,
        photoUrl: pPhotoUrl,
        profileImageUrl: pPhotoUrl,
        verificationStatus: 'pending',
        isDriverApplied: true,
        userType: 'passenger', // Stay passenger until approved
        appliedAt: serverTimestamp()
      });

      setStep(4);
    } catch (error) {
      console.error(error);
      alert("Submission failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      {/* Header - Cleaned up */}
      <div className="p-4 flex items-center gap-4 border-b border-[#333333] bg-black z-10">
        <button onClick={handlePrev} disabled={loading} className="w-10 h-10 flex items-center justify-center active:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="text-white w-7 h-7 rotate-180" />
        </button>
        <h2 className="font-bold text-[18px] flex-1 text-center pr-10 text-white">
          {step === 4 ? 'Status' : 'Driver Registration'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-black no-scrollbar">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-[22px] font-bold text-white">Vehicle Details</h3>
                <p className="text-[#666666] text-sm">Please provide your car information.</p>
              </div>
              <div className="space-y-4">
                <Input label="Vehicle Make" placeholder="e.g. Toyota" value={formData.vehicleMake} onChange={e => setFormData({...formData, vehicleMake: e.target.value})} />
                <Input label="Vehicle Model" placeholder="e.g. Corolla" value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})} />
                <Input label="Registration Number" placeholder="e.g. ABC-1234" value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
              </div>
              <div className="pt-4">
                <Button onClick={handleNext} disabled={!formData.vehicleMake || !formData.vehicleModel || !formData.registrationNumber}>
                    Next Step
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-[22px] font-bold text-white">Document Photos</h3>
                <p className="text-[#666666] text-sm">Upload clear photos of your official documents.</p>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { id: 'licenseFront', label: 'License (Front)', value: licenseFront },
                  { id: 'licenseBack', label: 'License (Back)', value: licenseBack },
                  { id: 'cnicFront', label: 'CNIC (Front)', value: cnicFront },
                  { id: 'profilePhoto', label: 'Profile Photo (Selfie)', value: profilePhoto },
                ].map((item) => (
                  <button key={item.id} onClick={() => setActivePicker(item.id as any)} className="w-full text-left">
                    <div className={`android-card p-5 border flex items-center justify-between transition-all ${item.value ? 'bg-[#FFD50008] border-[#FFD50020]' : 'border-white/[0.05]'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.value ? 'bg-[#FFD500]' : 'bg-black border border-white/5'}`}>
                          {item.value ? <CheckCircle2 className="text-black w-5 h-5" /> : <Camera className="text-[#666666] w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-white">{item.label}</p>
                          <p className={`text-[11px] font-bold ${item.value ? 'text-[#FFD500]' : 'text-[#444444]'}`}>
                            {item.value ? 'Photo Selected' : 'Not Uploaded'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#333333]" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-[#1A1A1A] p-5 rounded-[24px] border border-white/[0.03] flex gap-4 items-center mt-2">
                <ShieldCheck className="text-[#FFD500] w-6 h-6 shrink-0" />
                <p className="text-[12px] text-[#888888] leading-tight">Your documents are processed securely for identity verification.</p>
              </div>

              <div className="pt-4">
                <Button onClick={handleNext} disabled={!licenseFront || !licenseBack || !cnicFront || !profilePhoto}>
                    Review Application
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="space-y-1">
                <h3 className="text-[22px] font-bold text-white">Review & Submit</h3>
                <p className="text-[#666666] text-sm font-medium">Final check before sending to admin.</p>
              </div>

              <div className="android-card-elevated p-6 space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#666666] uppercase">Vehicle Info</span>
                    <span className="text-[11px] font-bold text-[#FFD500]">VERIFIED</span>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[17px] font-bold text-white leading-none">{formData.vehicleMake} {formData.vehicleModel}</p>
                    <p className="text-[13px] text-[#666666] font-bold">{formData.registrationNumber}</p>
                 </div>

                 <div className="h-px bg-white/5" />

                 <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-[#666666] uppercase">Document Status</span>
                    <span className="text-[11px] font-bold text-[#FFD500]">READY</span>
                 </div>
                 <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-12 h-12 bg-black rounded-xl border border-white/5 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                        </div>
                    ))}
                 </div>
              </div>

              <div className="pt-6 space-y-4">
                <Button onClick={handleSubmit} loading={loading} className="android-btn-primary">
                   Submit Application
                </Button>
                <p className="text-center text-[10px] font-bold text-[#333333] uppercase tracking-[0.2em]">Travel Buddy Security Protocol V2</p>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="status" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center space-y-8 pt-10">
              <div className="w-[100px] h-[100px] bg-[#FFD50010] rounded-full flex items-center justify-center border border-[#FFD50020]">
                <Clock className="w-12 h-12 text-[#FFD500] animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-[22px] font-bold text-white">Review in Progress</h3>
                <p className="text-[#666666] text-sm leading-relaxed max-w-[260px] mx-auto">
                  Our team is reviewing your documents. This usually takes up to 24 hours.
                </p>
              </div>

              <div className="android-card-elevated p-6 w-full text-left bg-[#1A1A1A]">
                <p className="text-[11px] font-bold text-[#444444] uppercase mb-2">Next Steps</p>
                <p className="text-[13px] text-[#888888]">
                  You will be notified once your account is approved. You can then start accepting rides!
                </p>
              </div>

              <Button onClick={onClose} variant="secondary">Back to Dashboard</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlays */}
      <MediaPickerDialog
        isOpen={!!activePicker}
        onClose={() => setActivePicker(null)}
        onSelect={onMediaSelect}
      />

      <PhotoConfirmDialog
        isOpen={!!pendingPhoto}
        onClose={() => setPendingPhoto(null)}
        photoUrl={pendingPhoto?.url || ''}
        onConfirm={confirmPhoto}
        onRetake={() => setPendingPhoto(null)}
      />

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="bg-[#212121] rounded-[32px] p-10 flex flex-col items-center gap-6 shadow-2xl">
              <Loader2 className="w-12 h-12 animate-spin text-[#FFD500]" />
              <div className="text-center">
                <p className="text-lg font-bold text-white uppercase tracking-tight">{uploadStatus}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
