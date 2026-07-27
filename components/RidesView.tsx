'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Loader2,
  MapPin,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Shield,
  Star,
  User,
  Check,
  MoreVertical
} from 'lucide-react';
import { UserMode, Ride } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

interface RidesViewProps {
  userMode: UserMode;
  onOpenOptions: (rideId: string) => void;
}

export default function RidesView({ userMode, onOpenOptions }: RidesViewProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
    const collectionName = userMode === 'driver' ? "rides" : "bookings";
    const idField = userMode === 'driver' ? "driverId" : "passengerId";

    const q = query(
      collection(db, collectionName),
      where(idField, "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userMode]);

  const filteredHistory = history.filter(item => {
    if (filter === 'All') return true;
    return item.status?.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header - Matches activity_trip_history.xml */}
      <div className="sticky top-0 z-20 bg-black p-4 border-b border-[#333333]">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-0.5">
            <h2 className="text-[20px] font-bold text-white tracking-tight">
              {userMode === 'passenger' ? 'Trip History' : 'My Posted Rides'}
            </h2>
            <p className="text-[12px] text-[#666666] font-bold uppercase tracking-widest">
              {loading ? 'Checking bookings...' : `${filteredHistory.length} Rides Found`}
            </p>
          </div>
          <button className="w-10 h-10 bg-[#1A1A1A] rounded-full flex items-center justify-center border border-white/5 active:scale-95 transition-transform">
            <Search className="text-[#666666] w-5 h-5" />
          </button>
        </div>

        {/* Filter Scroll - Matches HorizontalScrollView in Android */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {['All', 'Ongoing', 'Completed', 'Reserved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-full text-[12px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${
                filter === f
                  ? 'bg-[#FFD500] border-[#FFD500] text-black shadow-lg shadow-[#FFD500]/10'
                  : 'bg-[#1A1A1A] border-[#333333] text-[#666666]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-[#FFD500] animate-spin" />
            <p className="text-[#666666] text-[10px] font-black uppercase tracking-[0.2em]">Syncing Records</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-20 grayscale">
            <Clock className="w-16 h-16 mb-4" />
            <p className="font-black uppercase tracking-widest text-xs italic text-white">No {userMode === 'passenger' ? 'bookings' : 'rides'} found</p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div key={item.id} className="w-full text-left active:scale-[0.98] transition-transform relative group">
              {/* Card - Matches item_ride_post.xml design used in history */}
              <div className="bg-[#1E1E1E] rounded-[24px] p-6 shadow-xl border border-white/[0.03] relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 bg-[#2A2A2A] rounded-[27px] flex items-center justify-center overflow-hidden border border-white/5">
                      {item.driverPhoto ? (
                        <img src={item.driverPhoto} alt={item.driverName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-[#666666] w-7 h-7" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[17px] text-white">
                          {userMode === 'passenger' ? item.driverName : 'Me (Driver)'}
                        </h4>
                        <Shield className="w-4 h-4 text-[#FFD500]" fill="currentColor" />
                      </div>
                      <div className="flex items-center gap-1 text-[12px] font-bold text-[#FFD500]">
                        <Star className="w-3.5 h-3.5 fill-[#FFD500]" />
                        {item.rating || '5.0'}
                        <span className="text-[#666666] ml-1">({item.tripsCount || 0} Trips)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge - Matches llStatusBadge in Android */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                      item.status?.toLowerCase() === 'completed'
                        ? 'bg-green-500/10 border-green-500/20 text-green-500'
                        : 'bg-[#FFD500]/10 border-[#FFD500]/20 text-[#FFD500]'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${item.status?.toLowerCase() === 'completed' ? 'bg-green-500' : 'bg-[#FFD500]'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.status || 'Active'}</span>
                    </div>

                    {/* More Options - Matches ivMoreOptions in Android */}
                    {userMode === 'driver' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenOptions(item.id);
                        }}
                        className="p-2 text-[#666666] hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Route Section */}
                <div className="flex gap-4 mb-6 px-1">
                  <div className="flex flex-col items-center py-1">
                    <div className="w-2 h-2 rounded-full bg-[#FFD500]" />
                    <div className="w-[1.5px] flex-1 bg-white/20 my-1.5" />
                    <div className="w-3 h-3 text-[#E46767]">
                      <MapPin className="w-full h-full" fill="currentColor" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <p className="text-[13px] text-white font-medium line-clamp-1">{item.pickupLocation || item.pickup}</p>
                    <p className="text-[13px] text-white font-medium line-clamp-1">{item.dropOffLocation || item.dropoff}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#666666]" />
                    <span className="text-[11px] font-black text-[#666666] uppercase tracking-wider">
                      {item.date || item.departureDate || 'Recent'}
                    </span>
                  </div>
                  <p className="text-[20px] font-black text-white tracking-tighter italic">
                    RS {item.totalPrice || item.price}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
