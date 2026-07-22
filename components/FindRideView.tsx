'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Search, Star, User, Check, Clock, Loader2 } from 'lucide-react';
import { Ride } from '@/types';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface FindRideViewProps {
  onClose: () => void;
}

export default function FindRideView({ onClose }: FindRideViewProps) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState({
    from: '',
    to: '',
    date: ''
  });

  const fetchRides = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "rides"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedRides: Ride[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRides.push(doc.data() as Ride);
      });
      setRides(fetchedRides);
    } catch (error) {
      console.error("Error fetching rides: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  const filteredRides = rides.filter(ride =>
    ride.dropoff.toLowerCase().includes(searchQuery.to.toLowerCase()) &&
    ride.pickup.toLowerCase().includes(searchQuery.from.toLowerCase())
  );

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      <div className="p-4 flex items-center gap-4">
        <button onClick={onClose}><ArrowLeft className="text-white w-7 h-7" /></button>
        <h2 className="font-bold text-[20px]">Find a Ride</h2>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
        <div className="space-y-4">
           <Input
             label="From"
             icon={<MapPin className="w-5 h-5" />}
             placeholder="Enter pickup location"
             value={searchQuery.from}
             onChange={(e) => setSearchQuery({...searchQuery, from: e.target.value})}
           />
           <Input
             label="To"
             icon={<MapPin className="w-5 h-5" />}
             placeholder="Enter destination"
             className="!border-[#FFD500]"
             value={searchQuery.to}
             onChange={(e) => setSearchQuery({...searchQuery, to: e.target.value})}
           />
           <Input
             label="Date"
             icon={<Calendar className="w-5 h-5" />}
             placeholder="Select date"
             type="date"
             className="invert opacity-60"
             value={searchQuery.date}
             onChange={(e) => setSearchQuery({...searchQuery, date: e.target.value})}
           />

           <Button onClick={fetchRides} className="!h-[56px] !rounded-[24px]">
              <Search className="w-5 h-5" />
              <span>Search Rides</span>
           </Button>
        </div>

        <div className="flex justify-between items-center mt-8 mb-4">
          <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">Available Rides ({filteredRides.length})</h3>
          <button onClick={fetchRides} className="text-[#FFD500] text-xs font-bold">Refresh</button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-[#FFD500] animate-spin" />
            <p className="text-[#ABABAB] text-sm">Searching for best rides...</p>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 bg-[#212121] rounded-full flex items-center justify-center mx-auto">
              <Search className="text-[#333333] w-8 h-8" />
            </div>
            <p className="text-[#ABABAB] text-sm italic">No rides found for this route.</p>
          </div>
        ) : (
          filteredRides.map((ride, i) => (
            <Card key={i} className="p-4 space-y-4">
               <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                     <div className="w-12 h-12 bg-[#FFD500] rounded-full flex items-center justify-center">
                        <User className="text-black w-6 h-6" />
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-[15px]">{ride.driver}</h4>
                           <div className="bg-[#FFD500] p-0.5 rounded-full"><Check className="text-black w-2 h-2" /></div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-[#ABABAB]">
                           <Star className="w-3 h-3 text-[#FFD500] fill-[#FFD500]" /> {ride.rating}
                        </div>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[16px] font-bold text-[#FFD500]">RS {ride.price}</p>
                     <p className="text-[10px] text-[#ABABAB]">per seat</p>
                  </div>
               </div>

               <div className="space-y-2">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-[#FFD500]" />
                     <p className="text-[13px] text-white">{ride.pickup}</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-[#E46767]" />
                     <p className="text-[13px] text-white">{ride.dropoff}</p>
                  </div>
               </div>

               <div className="flex gap-4 text-[11px] text-[#ABABAB]">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {ride.date}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {ride.time}</div>
                  <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {ride.seats} seats</div>
               </div>

               <Button className="h-[48px] rounded-[24px] text-[15px]">
                  Book Now
               </Button>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
