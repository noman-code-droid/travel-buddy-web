'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Star,
  MapPin,
  Calendar,
  Clock,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Car,
  Users2,
  Plus,
  Minus,
  HandCoins,
  Map as MapIcon
} from 'lucide-react';
import { Ride } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';
import MakeOfferDialog from './ui/MakeOfferDialog';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

interface RideDetailsViewProps {
  onClose: () => void;
  rideId: string | null;
  onSelectPickupOnMap: (directions: any) => void;
  selectedPickup: { lat: number; lng: number; address: string; } | null;
  onViewDriverProfile: (id: string) => void;
}

export default function RideDetailsView({
  onClose,
  rideId,
  onSelectPickupOnMap,
  selectedPickup,
  onViewDriverProfile
}: RideDetailsViewProps) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [seatCount, setSeatCount] = useState(1);
  const [isFullRide, setIsFullRide] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [directions, setDirections] = useState<any>(null);

  useEffect(() => {
    if (!rideId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "rides", rideId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Ride;
          setRide(data);

          // Calculate directions for the pickup selector
          if (window.google) {
            const directionsService = new google.maps.DirectionsService();
            directionsService.route(
              {
                origin: { lat: data.pickupLat, lng: data.pickupLng },
                destination: { lat: data.dropoffLat, lng: data.dropoffLng },
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                  setDirections(result);
                }
              }
            );
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
      await addDoc(collection(db, "bookings"), {
        rideId: ride.id,
        driverId: ride.driverId,
        driverName: ride.driver,
        passengerId: auth.currentUser.uid,
        passengerName: auth.currentUser.displayName || 'User',
        seatsBooked: seatCount,
        totalPrice: Number(ride.price) * seatCount,
        pickupLocation: selectedPickup?.address || ride.pickup,
        dropOffLocation: ride.dropoff,
        status: 'confirmed',
        timestamp: serverTimestamp()
      });

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

  const handleMakeOffer = async (price: number, seats: number) => {
    if (!ride || !auth.currentUser) return;

    setBooking(true);
    try {
      await addDoc(collection(db, "offers"), {
        rideId: ride.id,
        driverId: ride.driverId,
        passengerId: auth.currentUser.uid,
        passengerName: auth.currentUser.displayName || 'User',
        proposedPrice: price,
        seatsRequested: seats,
        status: 'pending',
        timestamp: serverTimestamp()
      });

      alert("Offer sent to driver!");
      setShowOfferDialog(false);
      onClose();
    } catch (error) {
      alert("Failed to send offer");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <div className="absolute inset-0 bg-black z-[80] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#FFD500] animate-spin" />
    </div>
  );

  if (!ride) return null;

  const availableSeats = Number(ride.seats) - (Number(ride.bookedSeats) || 0);

  const toggleFullRide = (checked: boolean) => {
    setIsFullRide(checked);
    if (checked) {
      setSeatCount(availableSeats);
    } else {
      setSeatCount(1);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="absolute inset-0 bg-black z-[80] flex flex-col"
    >
      {/* Header */}
      <div className="bg-black z-20 px-2 py-3 flex items-center justify-between border-b border-[#333333]">
        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center active:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="text-white w-7 h-7 rotate-180" />
        </button>
        <h2 className="text-[20px] font-bold text-white flex-1 text-center pr-12">Ride Details</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 no-scrollbar">
        {/* Driver Card */}
        <div className="bg-[#1A1A1A] rounded-[32px] p-6 flex items-center gap-4 border border-white/5">
          <button
            onClick={() => onViewDriverProfile(ride.driverId)}
            className="w-16 h-16 bg-[#333333] rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 border-black active:scale-95 transition-transform"
          >
            {ride.driverPhoto ? (
              <img src={ride.driverPhoto} alt={ride.driver} className="w-full h-full object-cover" />
            ) : (
              <User className="text-[#666666] w-8 h-8" />
            )}
          </button>
          <div className="flex-1">
            <h3 className="text-[18px] font-bold text-white leading-tight">{ride.driver}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-[#FFD500]">
              <Star className="w-4 h-4 fill-[#FFD500]" />
              <span className="text-[13px] font-bold">{ride.rating.toFixed(1)}</span>
              <span className="text-[11px] text-[#666666] font-medium ml-1">Verified Expert</span>
            </div>
          </div>
          <div className="w-8 h-8 flex items-center justify-center">
            <CheckCircle2 className="text-[#FFD500] w-7 h-7" />
          </div>
        </div>

        {/* Info Pill */}
        <div className="bg-[#FFD50010] py-2 px-4 rounded-full border border-[#FFD50020] inline-block mx-auto self-center">
          <p className="text-[12px] font-black text-[#FFD500] uppercase tracking-widest text-center">
            Departs at {ride.time}
          </p>
        </div>

        {/* Route Details */}
        <div className="space-y-3">
          <label className="label-android ml-2">Pickup Point</label>
          <button
            onClick={() => directions && onSelectPickupOnMap(directions)}
            className="w-full bg-[#1A1A1A] rounded-[24px] p-6 flex items-center gap-4 border border-white/[0.03] active:bg-[#252525] transition-colors text-left"
          >
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <MapIcon className="text-[#FFD500] w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white leading-snug truncate">
                {selectedPickup?.address || ride.pickup}
              </p>
              <p className="text-[11px] text-[#666666] font-medium">
                {selectedPickup ? "Custom pickup point selected" : "Tap to select pickup point on route"}
              </p>
            </div>
            <ChevronRight className="text-[#444444] w-5 h-5" />
          </button>
        </div>

        {/* Booking Options Section */}
        <div className="space-y-4">
          <label className="label-android ml-2">Booking Options</label>
          <div className="bg-[#1A1A1A] rounded-[24px] p-6 space-y-6 border border-white/[0.03]">
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-bold text-white">Number of Seats</span>
              <div className="flex items-center gap-4 bg-black rounded-[20px] p-1.5 border border-white/5">
                <button
                  onClick={() => seatCount > 1 && setSeatCount(prev => prev - 1)}
                  className="w-10 h-10 flex items-center justify-center text-white/50 active:text-[#FFD500] transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-[18px] font-black text-white w-6 text-center">{seatCount}</span>
                <button
                  onClick={() => seatCount < availableSeats && setSeatCount(prev => prev + 1)}
                  className="w-10 h-10 flex items-center justify-center text-white/50 active:text-[#FFD500] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[16px] font-bold text-white">Book Full Ride</p>
                <p className="text-[12px] text-[#666666] font-medium">Reserve all available seats</p>
              </div>
              <div
                onClick={() => toggleFullRide(!isFullRide)}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${isFullRide ? 'bg-[#FFD500]' : 'bg-[#333333]'}`}
              >
                <div className={`w-6 h-6 bg-black rounded-full transition-transform ${isFullRide ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="space-y-4">
          <label className="label-android ml-2">Vehicle Information</label>
          <div className="bg-[#1A1A1A] rounded-[24px] p-6 space-y-6 border border-white/[0.03]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center border border-white/5">
                <Car className="text-[#FFD500] w-6 h-6" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-white uppercase tracking-tight">
                  {ride.vehicleMake} {ride.vehicleModel}
                </p>
                <p className="text-[13px] text-[#666666] font-black uppercase tracking-widest mt-0.5">
                  {ride.registrationNumber}
                </p>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            <div className="flex gap-3">
              {ride.hasAc && (
                <div className="bg-black border border-white/5 px-4 py-2 rounded-xl">
                  <span className="text-[13px] font-black text-white uppercase tracking-wider">AC</span>
                </div>
              )}
              <div className="bg-black border border-white/5 px-4 py-2 rounded-xl">
                 <span className="text-[13px] font-black text-white uppercase tracking-wider">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Row */}
        <div className="flex gap-4">
          <div className="flex-1 bg-[#1A1A1A] rounded-[24px] p-6 border border-white/5">
             <p className="text-[10px] font-black text-[#666666] uppercase tracking-[0.1em] mb-1.5">Price ({seatCount} Seat)</p>
             <p className="text-[20px] font-black text-[#FFD500] tracking-tight italic">RS {Number(ride.price) * seatCount}</p>
          </div>
          <div className="flex-1 bg-[#1A1A1A] rounded-[24px] p-6 border border-white/5">
             <p className="text-[10px] font-black text-[#666666] uppercase tracking-[0.1em] mb-1.5">Available Seats</p>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-[20px] font-black text-white tracking-tight">{availableSeats}</span>
                <span className="text-[10px] font-black text-[#666666] uppercase tracking-widest">Left</span>
             </div>
          </div>
        </div>

        {/* Identity Badge */}
        <div className="bg-[#1A1A1A] p-5 rounded-[24px] border border-white/[0.03] flex gap-4 items-center">
            <div className="w-10 h-10 bg-[#22C55E10] rounded-xl flex items-center justify-center shrink-0 border border-[#22C55E15]">
                <ShieldCheck className="text-[#22C55E] w-6 h-6" />
            </div>
            <p className="text-[11px] text-[#777777] leading-snug font-medium">
                Verified protocol active. Your booking is protected by Travel Buddy Security.
            </p>
        </div>
      </div>

      {/* Bottom Booking bar */}
      <div className="p-6 bg-black border-t border-[#333333] flex flex-col gap-4 sticky bottom-0 z-30">
        <div className="flex items-center gap-3">
          <button
            className="flex-1 android-btn-secondary !h-[60px] !rounded-full"
            onClick={() => setShowOfferDialog(true)}
          >
            <HandCoins className="w-5 h-5 text-white" />
            <span>Make Offer</span>
          </button>

          <button
            className="w-[60px] h-[60px] bg-white/5 rounded-full flex items-center justify-center active:bg-white/10 transition-colors shrink-0"
            onClick={() => alert("Chat initialized")}
          >
            <MessageSquare className="w-6 h-6 text-[#FFD500]" />
          </button>
        </div>

        <Button
          className="w-full !h-[64px] !rounded-full !text-[16px] uppercase tracking-widest font-black shadow-xl shadow-[#FFD500]/10"
          onClick={handleBooking}
          loading={booking}
          disabled={availableSeats <= 0}
        >
          {availableSeats <= 0 ? 'NO SEATS LEFT' : `CONFIRM BOOKING`}
        </Button>
      </div>

      {/* Make Offer Dialog */}
      <MakeOfferDialog
        isOpen={showOfferDialog}
        onClose={() => setShowOfferDialog(false)}
        basePrice={Number(ride.price)}
        maxSeats={availableSeats}
        onSubmit={handleMakeOffer}
      />
    </motion.div>
  );
}
