'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Search,
  Star,
  User,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  Navigation,
  ChevronRight,
  Shield,
  Compass
} from 'lucide-react';
import { Ride } from '@/types';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import RoutePreviewDialog from './ui/RoutePreviewDialog';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface FindRideViewProps {
  onClose: () => void;
  onRideClick: (id: string) => void;
  onViewDriverProfile: (id: string) => void;
}

export default function FindRideView({ onClose, onRideClick, onViewDriverProfile }: FindRideViewProps) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState({ from: '', to: '', date: '' });
  const [previewRide, setPreviewRide] = useState<Ride | null>(null);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "rides"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedRides = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
      setRides(fetchedRides);
    } catch (error) {
      console.error("Error fetching rides: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRides(); }, []);

  const filteredRides = rides.filter(ride =>
    (ride.dropoff || ride.dropOffLocation || '').toLowerCase().includes(searchQuery.to.toLowerCase()) &&
    (ride.pickup || ride.pickupLocation || '').toLowerCase().includes(searchQuery.from.toLowerCase())
  );

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      <div className="bg-black z-20">
        <div className="px-2 py-3 flex items-center justify-between border-b border-[#333333]">
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center active:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft className="text-white w-7 h-7 rotate-180" />
          </button>
          <h2 className="text-[20px] font-bold text-white flex-1 text-center pr-12">Find a Ride</h2>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto pb-24 no-scrollbar">
        <div className="space-y-4 px-1">
          <Input
            label="From"
            icon={<MapPin className="w-5 h-5" />}
            placeholder="Enter pickup location"
            value={searchQuery.from}
            onChange={e => setSearchQuery({...searchQuery, from: e.target.value})}
          />
          <Input
            label="To"
            icon={<MapPin className="w-5 h-5 text-[#FFD500]" />}
            placeholder="Enter destination"
            value={searchQuery.to}
            onChange={e => setSearchQuery({...searchQuery, to: e.target.value})}
          />
          <div className="pt-2">
            <Button onClick={fetchRides} className="android-btn-primary">
              <Search className="w-5 h-5" />
              <span>Search Rides</span>
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 px-2">
          <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">
            Available Rides ({filteredRides.length})
          </h3>
          <button onClick={fetchRides} className="text-[#FFD500] active:rotate-180 transition-transform p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-[#FFD500] animate-spin" />
            <p className="text-[#666666] text-[10px] font-bold uppercase tracking-widest">Syncing active routes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRides.map((ride) => (
              <div key={ride.id} className="w-full text-left">
                <div className="bg-[#1E1E1E] rounded-[24px] p-6 border border-white/[0.03]">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <button
                        onClick={() => onViewDriverProfile(ride.driverId)}
                        className="w-14 h-14 bg-[#2A2A2A] rounded-[27px] flex items-center justify-center overflow-hidden border border-white/5 active:scale-95 transition-transform shrink-0"
                      >
                        {ride.driverPhoto ? (
                          <img src={ride.driverPhoto} alt={ride.driver} className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-[#666666] w-7 h-7" />
                        )}
                      </button>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[17px] text-white">{ride.driver}</h4>
                          <Shield className="w-4 h-4 text-[#FFD500]" fill="currentColor" />
                        </div>
                        <div className="flex items-center gap-1 text-[12px] font-bold text-[#FFD500]">
                          <Star className="w-3.5 h-3.5 fill-[#FFD500]" />
                          {ride.rating ? Number(ride.rating).toFixed(1) : '5.0'}
                          <span className="text-[#666666] ml-1">({ride.trips || 0} Trips)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-6 px-1">
                    <div className="flex flex-col items-center py-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FFD500]" />
                      <div className="w-[1.5px] flex-1 bg-white/10 my-1.5" />
                      <div className="w-3 h-3 text-[#E46767]">
                        <MapPin className="w-full h-full" fill="currentColor" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="text-[13px] text-white font-medium truncate">{ride.pickup || ride.pickupLocation}</p>
                      <p className="text-[13px] text-white font-medium truncate">{ride.dropoff || ride.dropOffLocation}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-white/5">
                    <div className="space-y-3">
                      <div className="flex gap-4 text-[11px] font-bold text-[#666666] uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {ride.time}</span>
                        <span className="flex items-center gap-1.5 text-[#FFD500]">{Number(ride.seats) - Number(ride.bookedSeats)} SEATS</span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-xl border border-white/5">
                         <Check className="w-3 h-3 text-[#FFD500]" strokeWidth={3} />
                         <span className="text-[10px] font-bold text-[#FFD500] uppercase">Available</span>
                      </div>
                    </div>
                    <p className="text-[22px] font-bold text-[#FFD500]">PKR {ride.price}</p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setPreviewRide(ride)}
                      className="flex-1 h-[48px] rounded-[24px] border border-white/10 text-[#ABABAB] font-bold text-[12px] uppercase flex items-center justify-center gap-2"
                    >
                      <Compass className="w-4 h-4" />
                      View Route
                    </button>
                    <button
                      onClick={() => onRideClick(ride.id)}
                      className="flex-1 h-[48px] rounded-[24px] bg-[#FFD500] text-black font-bold text-[12px] uppercase active:scale-95 transition-transform"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RoutePreviewDialog
        isOpen={!!previewRide}
        onClose={() => setPreviewRide(null)}
        pickup={{ lat: previewRide?.pickupLat || 0, lng: previewRide?.pickupLng || 0 }}
        dropoff={{ lat: previewRide?.dropoffLat || 0, lng: previewRide?.dropoffLng || 0 }}
      />
    </motion.div>
  );
}
