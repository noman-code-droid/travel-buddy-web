'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Star, MapPin, Calendar, Clock, MessageSquare, ChevronRight, CheckCircle2, ShieldCheck, Loader2, Car, Users } from 'lucide-react';
import { Ride } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';

interface RideDetailsViewProps {
  onClose: () => void;
  rideId: string | null;
}

export default function RideDetailsView({ onClose, rideId }: RideDetailsViewProps) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [seatCount, setSeatCount] = useState(1);
  const [existingBooking, setExistingBooking] = useState<any>(null);

  useEffect(() => {
    if (!rideId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "rides", rideId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRide({ id: docSnap.id, ...docSnap.data() } as Ride);
        }

        // Check for existing booking (parity with Android)
        if (auth.currentUser) {
          const q = query(
            collection(db, "bookings"),
            where("rideId", "==", rideId),
            where("passengerId", "==", auth.currentUser.uid),
            where("status", "in", ["confirmed", "active"])
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setExistingBooking(snap.docs[0].data());
          }
        }
      } catch (error) {
        console.error("Error fetching ride details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [rideId]);

  const handleBooking = async () => {
    if (!ride || !auth.currentUser) return;

    setBooking(true);
    try {
      // 1. Create Booking
      await addDoc(collection(db, "bookings"), {
        rideId: ride.id,
        driverId: ride.driverId,
        driverName: ride.driver,
        passengerId: auth.currentUser.uid,
        passengerName: auth.currentUser.displayName || 'User',
        seatsBooked: seatCount,
        totalPrice: Number(ride.price) * seatCount,
        pickupLocation: ride.pickup,
        dropOffLocation: ride.dropoff,
        status: 'confirmed',
        timestamp: serverTimestamp()
      });

      // 2. Update Ride available seats
      const rideRef = doc(db, "rides", ride.id);
      await updateDoc(rideRef, {
        bookedSeats: increment(seatCount)
      });

      alert("Ride booked successfully!");
      onClose();
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <div className="absolute inset-0 bg-black z-[80] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FFD500] animate-spin" />
    </div>
  );

  if (!ride) return null;

  const availableSeats = Number(ride.seats) - (Number(ride.bookedSeats) || 0);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[80] flex flex-col"
    >
      <div className="p-4 flex items-center gap-4 border-b border-[#333333]">
        <button onClick={onClose}><ArrowLeft className="text-white w-7 h-7" /></button>
        <h2 className="font-bold text-[20px]">Ride Details</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        {/* Driver Section */}
        <Card variant="flat" className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#FFD500] rounded-full flex items-center justify-center overflow-hidden border-2 border-black">
              {ride.driverPhoto ? (
                <img src={ride.driverPhoto} alt={ride.driver} className="w-full h-full object-cover" />
              ) : (
                <User className="text-black w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{ride.driver}</h3>
              <div className="flex items-center gap-1 text-[#FFD500]">
                <Star className="w-4 h-4 fill-[#FFD500]" />
                <span className="text-xs font-bold">{ride.rating.toFixed(1)}</span>
                <span className="text-[#666666] text-[10px] ml-1">Driver Rating</span>
              </div>
            </div>
          </div>
          <button className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center active:bg-white/10 transition-colors">
            <MessageSquare className="text-[#FFD500] w-6 h-6" />
          </button>
        </Card>

        {/* Route Card */}
        <Card variant="flat" className="p-5 space-y-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center py-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFD500]" />
              <div className="w-px flex-1 bg-[#333333] my-2" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#E46767]" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-[#666666] uppercase">Pickup</p>
                <p className="text-[15px] font-medium text-white">{ride.pickup}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#666666] uppercase">Destination</p>
                <p className="text-[15px] font-medium text-white">{ride.dropoff}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#333333] grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#FFD500]" />
              <span className="text-xs text-[#ABABAB] font-medium">{ride.date}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#FFD500]" />
              <span className="text-xs text-[#ABABAB] font-medium">{ride.time}</span>
            </div>
          </div>
        </Card>

        {/* Vehicle Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#666666] uppercase ml-1">Vehicle Details</h4>
          <Card variant="flat" className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-black rounded-xl border border-[#333333]">
                <Car className="text-[#FFD500] w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">{ride.vehicleMake} {ride.vehicleModel}</p>
                <p className="text-[11px] text-[#ABABAB] uppercase tracking-widest">{ride.registrationNumber}</p>
              </div>
            </div>
            {ride.hasAc && (
              <span className="bg-[#22C55E20] text-[#22C55E] text-[10px] font-black px-2 py-1 rounded-md border border-[#22C55E30]">AC</span>
            )}
          </Card>
        </div>

        {/* Seat Selection */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#666666] uppercase ml-1">Select Seats</h4>
              <p className="text-[10px] text-[#ABABAB] ml-1">{availableSeats} seats left in this car</p>
            </div>
            <div className="flex items-center gap-6 bg-[#212121] rounded-2xl p-2 border border-[#333333]">
              <button
                onClick={() => seatCount > 1 && setSeatCount(seatCount - 1)}
                className="w-10 h-10 flex items-center justify-center text-2xl text-[#FFD500] font-bold active:scale-90"
              >
                −
              </button>
              <span className="text-xl font-black text-white w-4 text-center">{seatCount}</span>
              <button
                onClick={() => seatCount < availableSeats && setSeatCount(seatCount + 1)}
                className="w-10 h-10 flex items-center justify-center text-2xl text-[#FFD500] font-bold active:scale-90"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center bg-[#212121] p-4 rounded-2xl border border-[#333333]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-[#FFD500]" />
              </div>
              <span className="text-sm font-medium">Reserve all {availableSeats} seats</span>
            </div>
            <input
              type="checkbox"
              checked={seatCount === availableSeats}
              onChange={(e) => setSeatCount(e.target.checked ? availableSeats : 1)}
              className="w-6 h-6 accent-[#FFD500]"
            />
          </div>
        </div>

        {/* Notes */}
        {ride.notes && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#666666] uppercase ml-1">Notes from Driver</h4>
            <Card variant="flat" className="p-4">
              <p className="text-sm text-[#ABABAB] leading-relaxed italic italic">"{ride.notes}"</p>
            </Card>
          </div>
        )}

        {/* Safety Badge */}
        <div className="bg-[#22C55E10] border border-[#22C55E30] p-4 rounded-2xl flex gap-3">
          <ShieldCheck className="text-[#22C55E] w-5 h-5 shrink-0" />
          <p className="text-[11px] text-[#22C55E] font-medium leading-relaxed">
            Verified Trip: You are covered by Travel Buddy's real-time safety monitoring and SOS assistance.
          </p>
        </div>
      </div>

      {/* Bottom Booking bar */}
      <footer className="p-6 bg-black border-t border-[#333333] flex items-center justify-between gap-6 fixed bottom-0 left-0 right-0 max-w-[360px] mx-auto">
        <div className="shrink-0">
          <p className="text-[10px] text-[#ABABAB] font-bold uppercase">Total Price</p>
          <p className="text-xl font-black text-[#FFD500]">RS {Number(ride.price) * seatCount}</p>
        </div>
        <Button
          className="flex-1 !h-14"
          onClick={handleBooking}
          loading={booking}
          disabled={availableSeats <= 0}
        >
          {availableSeats <= 0 ? 'Full Ride' : `Book ${seatCount} ${seatCount === 1 ? 'Seat' : 'Seats'}`}
        </Button>
      </footer>
    </motion.div>
  );
}
