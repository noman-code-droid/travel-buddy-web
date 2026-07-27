'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  MessageSquare,
  Phone,
  MoreVertical,
  Loader2,
  Users2,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import Card from './ui/Card';
import Button from './ui/Button';

interface DriverManifestViewProps {
  onClose: () => void;
  rideId: string;
}

export default function DriverManifestView({ onClose, rideId }: DriverManifestViewProps) {
  const [passengers, setPassengers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rideData, setRideData] = useState<any>(null);

  useEffect(() => {
    if (!rideId) return;

    // 1. Fetch Ride Stats (Seats remaining)
    const unsubRide = onSnapshot(doc(db, "rides", rideId), (snapshot) => {
      setRideData(snapshot.data());
    });

    // 2. Fetch Confirmed Passengers
    const q = query(
      collection(db, "bookings"),
      where("rideId", "==", rideId),
      where("status", "==", "confirmed")
    );

    const unsubBookings = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPassengers(list);
      setLoading(false);
    });

    return () => {
      unsubRide();
      unsubBookings();
    };
  }, [rideId]);

  const seatsLeft = rideData ? (Number(rideData.seats) - Number(rideData.bookedSeats || 0)) : 0;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="absolute inset-0 bg-black z-[85] flex flex-col"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-[#333333] bg-black sticky top-0 z-10">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center active:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="text-white w-7 h-7 rotate-180" />
        </button>
        <h2 className="text-[20px] font-bold text-white flex-1 text-center pr-10">Passenger Manifest</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-10">

        {/* Ride Status Card */}
        <div className="bg-[#FFD50010] border border-[#FFD50020] rounded-[24px] p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFD500] rounded-2xl flex items-center justify-center shadow-lg">
              <Users2 className="text-black w-7 h-7" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-[16px] font-bold text-white uppercase tracking-tight">Active Group</h3>
              <p className="text-[12px] text-[#ABABAB] font-medium">People joining your ride</p>
            </div>
          </div>
          <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 text-right">
             <p className="text-[14px] font-black text-[#FFD500]">{seatsLeft} SEATS</p>
             <p className="text-[9px] font-bold text-[#666666] uppercase tracking-widest">Remaining</p>
          </div>
        </div>

        {/* Passenger List */}
        <div className="space-y-4">
          <h4 className="text-[12px] font-black text-[#666666] uppercase tracking-[0.2em] ml-2">Manifest Details</h4>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#FFD500]" /></div>
          ) : passengers.length === 0 ? (
            <div className="text-center py-20 opacity-20 grayscale flex flex-col items-center gap-4">
                <Users2 className="w-16 h-16" />
                <p className="font-black uppercase tracking-widest text-xs italic">Waiting for bookings...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {passengers.map((p) => (
                <div key={p.id} className="android-card p-5 border border-white/[0.03] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-[#2A333C] rounded-full flex items-center justify-center overflow-hidden border border-white/5">
                      {p.passengerPhoto ? (
                        <img src={p.passengerPhoto} alt={p.passengerName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-[#666666] w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-[17px] text-white leading-tight">{p.passengerName}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[13px] text-[#ABABAB] font-medium">{p.seatsBooked} Seats Total</span>
                        <span className="text-[12px] text-[#FFD500] font-black uppercase tracking-tighter">Waiting..</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button className="w-11 h-11 bg-white/5 rounded-full flex items-center justify-center active:bg-white/10 transition-colors">
                      <MessageSquare className="text-white w-5 h-5" />
                    </button>
                    <button className="w-11 h-11 bg-white/5 rounded-full flex items-center justify-center active:bg-white/10 transition-colors">
                      <MoreVertical className="text-white w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Safety Note */}
        <div className="bg-[#1A1A1A] p-6 rounded-[28px] border border-white/[0.03] space-y-4">
            <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#FFD500]" />
                <h4 className="font-bold text-[14px] text-white uppercase tracking-tight">Driver Protocol</h4>
            </div>
            <p className="text-[12px] text-[#888888] leading-relaxed">
                Please verify each passenger's identity before starting the trip. Use the internal chat for any coordination.
            </p>
        </div>

      </div>

      {/* Footer Action */}
      <div className="p-6 bg-black border-t border-[#333333] sticky bottom-0 z-10">
        <Button onClick={onClose} variant="secondary" className="!h-[60px] !rounded-full !text-[14px] font-black uppercase tracking-widest">
          Close Manager
        </Button>
      </div>
    </motion.div>
  );
}
