'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  CheckCircle2,
  Star,
  Car,
  ShieldCheck,
  Clock,
  Loader2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Button from './ui/Button';

interface DriverProfileDetailViewProps {
  onClose: () => void;
  driverId: string;
}

export default function DriverProfileDetailView({ onClose, driverId }: DriverProfileDetailViewProps) {
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) return;
    const fetchDriver = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, "users", driverId));
        if (docSnap.exists()) {
          setDriver(docSnap.data());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [driverId]);

  if (loading) return (
    <div className="absolute inset-0 bg-black z-[95] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FFD500] animate-spin" />
    </div>
  );

  if (!driver) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[95] flex flex-col"
    >
      {/* Header - Matches activity_driver_profile_detail.xml */}
      <div className="p-4 flex items-center justify-between border-b border-[#333333] bg-black sticky top-0 z-10">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center active:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="text-white w-7 h-7 rotate-180" />
        </button>
        <h2 className="text-[20px] font-bold text-white flex-1 text-center pr-10">Driver Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-10 no-scrollbar">

        {/* Profile Card */}
        <div className="bg-[#212121] rounded-[32px] p-8 flex flex-col items-center text-center shadow-xl border border-white/[0.03]">
          <div className="w-24 h-24 bg-[#333333] rounded-full overflow-hidden border-4 border-black shadow-lg mb-4">
            {driver.photoUrl ? (
              <img src={driver.photoUrl} alt={driver.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-6 text-[#666666]" />
            )}
          </div>

          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
            {driver.name}
          </h3>

          <div className="bg-[#FFD50010] px-4 py-1.5 rounded-full border border-[#FFD50020] flex items-center gap-2">
            <ShieldCheck className="text-[#FFD500] w-4 h-4" />
            <span className="text-[12px] font-black text-[#FFD500] uppercase tracking-widest">Verified Professional</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4">
          <div className="flex-1 bg-[#1A1A1A] rounded-[24px] p-5 border border-white/5 flex flex-col items-center">
            <span className="text-[20px] font-black text-white italic tracking-tighter">{driver.driverTrips || 0}</span>
            <span className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] mt-1">Trips Done</span>
          </div>
          <div className="flex-1 bg-[#1A1A1A] rounded-[24px] p-5 border border-white/5 flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-[#FFD500] fill-[#FFD500]" />
              <span className="text-[20px] font-black text-[#FFD500] italic tracking-tighter">
                {(driver.driverRating || 5.0).toFixed(1)}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#666666] uppercase tracking-[0.2em] mt-1">Avg Rating</span>
          </div>
        </div>

        {/* Vehicle Details - Matches itemized layout in XML */}
        <div className="space-y-4">
          <h4 className="text-[13px] font-black text-[#666666] uppercase tracking-[0.2em] ml-2">Vehicle Details</h4>

          <div className="bg-[#1A1A1A] rounded-[28px] overflow-hidden border border-white/[0.03]">
            <div className="p-6 space-y-6">

              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#666666] uppercase tracking-widest">Make / Brand</p>
                  <p className="text-[16px] font-bold text-white uppercase tracking-tight">{driver.vehicleMake || 'Toyota'}</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-white/5">
                  <Car className="text-[#FFD500] w-6 h-6" />
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-1">
                <p className="text-[10px] font-black text-[#666666] uppercase tracking-widest">Model & Color</p>
                <p className="text-[16px] font-bold text-white uppercase tracking-tight">
                  {driver.vehicleModel || 'Corolla'} • {driver.vehicleColor || 'White'}
                </p>
              </div>

              <div className="h-px bg-white/5" />

              <div className="space-y-1">
                <p className="text-[10px] font-black text-[#666666] uppercase tracking-widest">Registration Number</p>
                <p className="text-[16px] font-bold text-[#FFD500] uppercase tracking-[0.1em]">{driver.registrationNumber || 'ABC-1234'}</p>
              </div>

              {driver.hasAc && (
                <>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#22C55E] w-5 h-5" />
                    <p className="text-[14px] text-white font-medium">Air Conditioning (AC) Available</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 py-6 opacity-30 grayscale">
            <ShieldCheck className="w-10 h-10" />
            <p className="text-[11px] font-black text-white uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed">
              Account details verified by Travel Buddy Support
            </p>
        </div>

      </div>

      <div className="p-6 bg-black border-t border-[#333333] sticky bottom-0">
        <Button onClick={onClose} className="android-btn-primary !h-[64px] !rounded-full uppercase tracking-widest font-black italic shadow-xl shadow-[#FFD500]/10">
          Done Viewing
        </Button>
      </div>
    </motion.div>
  );
}
