'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Search, Star, User, Check, Clock, Loader2, RefreshCw } from 'lucide-react';
import { Ride } from '@/types';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface FindRideViewProps {
  onClose: () => void;
  onRideClick: (id: string) => void;
}

export default function FindRideView({ onClose, onRideClick }: FindRideViewProps) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState({ from: '', to: '', date: '' });

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
    ride.dropoff.toLowerCase().includes(searchQuery.to.toLowerCase()) &&
    ride.pickup.toLowerCase().includes(searchQuery.from.toLowerCase())
  );

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-black z-[60] flex flex-col">
      <div className="p-4 flex items-center gap-4 border-b border-[#333333]">
        <button onClick={onClose}><ArrowLeft className="text-white w-7 h-7" /></button>
        <h2 className="font-bold text-[20px]">Explore Rides</h2>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
        <Card variant="flat" className="p-4 space-y-4">
           <Input label="From" icon={<MapPin className="w-5 h-5" />} placeholder="Pickup location" value={searchQuery.from} onChange={e => setSearchQuery({...searchQuery, from: e.target.value})} />
           <Input label="To" icon={<MapPin className="w-5 h-5 text-[#FFD500]" />} placeholder="Destination" className="!border-[#FFD500]" value={searchQuery.to} onChange={e => setSearchQuery({...searchQuery, to: e.target.value})} />
           <Button onClick={fetchRides} className="!h-[56px] !rounded-[24px]">Search Rides</Button>
        </Card>

        <div className="flex justify-between items-center mt-6 px-1">
          <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Available Rides ({filteredRides.length})</h3>
          <button onClick={fetchRides} className="text-[#FFD500] active:rotate-180 transition-transform"><RefreshCw className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-[#FFD500] animate-spin" />
            <p className="text-[#666666] text-xs font-bold uppercase tracking-widest">Finding Best Routes</p>
          </div>
        ) : (
          filteredRides.map((ride) => (
            <button key={ride.id} onClick={() => onRideClick(ride.id)} className="w-full text-left">
              <Card className="p-4 space-y-4 active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-[#FFD500] rounded-full flex items-center justify-center border-2 border-black">
                          <User className="text-black w-6 h-6" />
                      </div>
                      <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[15px]">{ride.driver}</h4>
                            <div className="bg-[#FFD500] p-0.5 rounded-full"><Check className="text-black w-2 h-2" /></div>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#ABABAB]">
                            <Star className="w-3 h-3 text-[#FFD500] fill-[#FFD500]" /> {ride.rating.toFixed(1)}
                          </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] font-bold text-[#FFD500]">RS {ride.price}</p>
                      <p className="text-[10px] text-[#666666] uppercase font-bold">Per Seat</p>
                    </div>
                </div>

                <div className="space-y-2 py-2 border-y border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#FFD500]" />
                      <p className="text-[13px] text-white/90 truncate">{ride.pickup}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#E46767]" />
                      <p className="text-[13px] text-white/90 truncate">{ride.dropoff}</p>
                    </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-[#666666] font-bold">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ride.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ride.time}</span>
                    </div>
                    <span className="text-[#FFD500]">{Number(ride.seats) - Number(ride.bookedSeats)} SEATS LEFT</span>
                </div>
              </Card>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}
