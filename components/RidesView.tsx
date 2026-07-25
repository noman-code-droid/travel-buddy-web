'use client';

import { useState, useEffect } from 'react';
import { Clock, Loader2, MapPin } from 'lucide-react';
import { UserMode } from '@/types';
import Card from './ui/Card';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

interface RidesViewProps {
  userMode: UserMode;
}

export default function RidesView({ userMode }: RidesViewProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
    // Fetch rides where the current user is the driver
    const q = query(
      collection(db, "rides"),
      where("driverId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(rides);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userMode]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Your {userMode === 'passenger' ? 'Recent Rides' : 'Ride Posts'}</h2>

      <div className="space-y-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#FFD500] animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 text-[#666666]">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="italic">No {userMode === 'passenger' ? 'rides' : 'posts'} found yet.</p>
          </div>
        ) : (
          history.map((ride, i) => (
            <Card key={ride.id || i} variant="flat" radius="xl" className="p-5 flex justify-between items-center shadow-sm">
              <div className="flex gap-4 items-center overflow-hidden">
                <div className="p-3 bg-black rounded-[16px] border border-[#333333] shrink-0">
                  <MapPin className="w-6 h-6 text-[#FFD500]" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-[14px] truncate text-white">{ride.dropoff || ride.dropOffLocation}</h4>
                  <p className="text-[11px] text-[#ABABAB]">{ride.date || ride.departureDate}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="font-bold text-[#FFD500] text-[16px]">RS {ride.price}</p>
                <p className={`text-[9px] uppercase font-black mt-1 tracking-tighter ${ride.status === 'available' || ride.status === 'Completed' ? 'text-[#22C55E]' : 'text-[#E46767]'}`}>
                  {ride.status || 'Active'}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
