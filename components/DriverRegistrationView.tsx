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
  AlertCircle
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
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

  // Real File states for Vercel Blob
  const [licenseFrontFile, setLicenseFrontFile] = useState<File | null>(null);
  const [licenseBackFile, setLicenseBackFile] = useState<File | null>(null);
  const [cnicFile, setCnicFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    vehicleMake: '',
    vehicleModel: '',
    registrationNumber: '',
    licenseNumber: '',
  });

  const uploadFile = async (file: File, label: string) => {
    setUploadProgress(`Uploading ${label}...`);
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      body: file,
    });

    if (!response.ok) throw new Error(`Failed to upload ${label}`);
    const blob = await response.json();
    return blob.url;
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => step > 1 ? setStep(prev => prev - 1) : onClose();

  const handleSubmit = async () => {
    if (!auth.currentUser || !licenseFrontFile || !licenseBackFile || !cnicFile) return;

    setLoading(true);
    try {
      // 1. Concurrent Upload to Vercel Blob
      const [licenseUrl, licenseBackUrl, cnicUrl] = await Promise.all([
        uploadFile(licenseFrontFile, 'License Front'),
        uploadFile(licenseBackFile, 'License Back'),
        uploadFile(cnicFile, 'Identity Card')
      ]);

      setUploadProgress('Finalizing profile...');

      // 2. Update Firestore with high-speed URLs
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        ...formData,
        licenseUrl,
        licenseBackUrl,
        cnicUrl,
        verificationStatus: 'pending',
        isDriverApplied: true,
        appliedAt: serverTimestamp()
      });

      setStep(4);
    } catch (error) {
      console.error(error);
      alert("Registration failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setUploadProgress('');
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

      <div className="flex-1 overflow-y-auto p-6 bg-black">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Vehicle Details</h3>
                <p className="text-[#666666] text-sm">Step 1 of 3: Provide car information.</p>
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
                <h3 className="text-2xl font-bold text-white">Identity & License</h3>
                <p className="text-[#666666] text-sm">Step 2 of 3: Secure document upload.</p>
              </div>

              <div className="space-y-4">
                {/* CNIC UPLOAD */}
                <div className="relative">
                   <input type="file" className="hidden" id="cnic-upload" onChange={(e) => setCnicFile(e.target.files?.[0] || null)} accept="image/*" />
                   <label htmlFor="cnic-upload">
                      <Card variant={cnicFile ? 'active' : 'flat'} className="p-5 border-dashed flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                           {cnicFile ? <FileCheck className="text-[#22C55E]" /> : <Upload className="text-[#FFD500]" />}
                           <span className="text-[12px] font-bold uppercase tracking-tight">{cnicFile ? 'CNIC Added' : 'Upload CNIC Front'}</span>
                        </div>
                        {cnicFile && <span className="text-[10px] text-[#666666]">{ (cnicFile.size / 1024).toFixed(0) } KB</span>}
                      </Card>
                   </label>
                </div>

                {/* LICENSE FRONT */}
                <div className="relative">
                   <input type="file" className="hidden" id="lic-front" onChange={(e) => setLicenseFrontFile(e.target.files?.[0] || null)} accept="image/*" />
                   <label htmlFor="lic-front">
                      <Card variant={licenseFrontFile ? 'active' : 'flat'} className="p-5 border-dashed flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                           {licenseFrontFile ? <FileCheck className="text-[#22C55E]" /> : <Upload className="text-[#FFD500]" />}
                           <span className="text-[12px] font-bold uppercase tracking-tight">License Front</span>
                        </div>
                      </Card>
                   </label>
                </div>

                {/* LICENSE BACK */}
                <div className="relative">
                   <input type="file" className="hidden" id="lic-back" onChange={(e) => setLicenseBackFile(e.target.files?.[0] || null)} accept="image/*" />
                   <label htmlFor="lic-back">
                      <Card variant={licenseBackFile ? 'active' : 'flat'} className="p-5 border-dashed flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                           {licenseBackFile ? <FileCheck className="text-[#22C55E]" /> : <Upload className="text-[#FFD500]" />}
                           <span className="text-[12px] font-bold uppercase tracking-tight">License Back</span>
                        </div>
                      </Card>
                   </label>
                </div>
              </div>

              <Button onClick={handleNext} disabled={!licenseFrontFile || !licenseBackFile || !cnicFile} className="mt-8">
                Next <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="space-y-2 w-full text-left">
                <h3 className="text-2xl font-bold text-white">Review & Submit</h3>
                <p className="text-[#666666] text-sm">Step 3 of 3: Verification guidelines.</p>
              </div>

              <Card variant="flat" className="w-full p-5 space-y-4 border-white/5">
                 <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] font-bold text-[#666666] uppercase">Vehicle Details</span>
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                 </div>
                 <p className="text-sm font-medium text-white/90">{formData.vehicleMake} {formData.vehicleModel} • {formData.registrationNumber}</p>

                 <div className="flex justify-between items-center border-b border-white/5 pb-3 pt-2">
                    <span className="text-[10px] font-bold text-[#666666] uppercase">Documents</span>
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                 </div>
                 <p className="text-xs text-[#ABABAB]">3 Images selected for secure upload.</p>
              </Card>

              <div className="bg-[#FFD50010] p-4 rounded-2xl border border-[#FFD50030] flex gap-3 text-left">
                <ShieldCheck className="w-5 h-5 text-[#FFD500] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[#FFD500] leading-relaxed">
                  Your data is encrypted. Verification usually takes **24 hours**. You will receive an in-app notification once approved.
                </p>
              </div>

              <div className="space-y-3">
                <Button onClick={handleSubmit} loading={loading} className="w-full">
                  {loading ? uploadProgress : 'Submit Application'}
                </Button>
                {loading && (
                    <p className="text-center text-[10px] font-bold text-[#666666] uppercase animate-pulse">Encryption in progress...</p>
                )}
              </div>
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
                  {status === 'approved' ? 'Verified Driver' : 'Under Review'}
                </h3>
                <p className="text-[#ABABAB] text-sm leading-relaxed max-w-[260px]">
                  {status === 'approved'
                    ? 'Congratulations! You are now a verified Travel Buddy driver. You can start posting rides.'
                    : 'Our team is reviewing your documents. We will notify you once approved.'}
                </p>
              </div>

              <Button onClick={onClose} className="mt-8 !rounded-[24px]">Back to Dashboard</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
