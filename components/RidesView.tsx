'use client';

import { useState, useEffect } from 'react';
import { Clock, Loader2, MapPin, ChevronRight } from 'lucide-react';
import { UserMode, Ride } from '@/types';
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

    // Logic: If driver, show 'rides' collection. If passenger, show 'bookings' collection.
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

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-white">
          {userMode === 'passenger' ? 'My Bookings' : 'My Posted Rides'}
        </h2>
        <p className="text-[#666666] text-xs font-bold uppercase tracking-widest">
          {userMode === 'passenger' ? 'Your travel history' : 'Management Console'}
        </p>
      </div>

      <div className="space-y-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#FFD500] animate-spin" />
            <p className="text-[10px] font-bold text-[#333333] uppercase">Syncing Database</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-[#121212] rounded-[32px] border border-white/5">
            <Clock className="w-12 h-12 mx-auto mb-4 text-[#333333]" />
            <p className="text-[#666666] italic text-sm">No {userMode === 'passenger' ? 'bookings' : 'rides'} found.</p>
          </div>
        ) : (
          history.map((item, i) => (
            <Card key={item.id || i} variant="flat" radius="xl" className="p-5 flex justify-between items-center active:scale-[0.98] transition-transform">
              <div className="flex gap-4 items-center overflow-hidden">
                <div className="w-12 h-12 bg-black rounded-2xl border border-white/5 flex items-center justify-center shrink-0">
                  <MapPin className={`w-5 h-5 ${userMode === 'passenger' ? 'text-[#FFD500]' : 'text-[#22C55E]'}`} />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-[14px] truncate text-white">
                    {item.dropOffLocation || item.dropoff || 'Location Unknown'}
                  </h4>
                  <p className="text-[11px] text-[#666666] font-medium">
                    {item.date || item.departureDate || 'Date not set'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="font-black text-[#FFD500] text-[15px]">
                  RS {item.totalPrice || item.price}
                </p>
                <div className="flex items-center gap-1 justify-end mt-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${
                     (item.status || '').toLowerCase() === 'confirmed' || (item.status || '').toLowerCase() === 'available'
                     ? 'bg-[#22C55E]' : 'bg-[#FFD500]'
                   }`} />
                   <p className="text-[9px] uppercase font-black text-[#666666] tracking-tighter">
                     {item.status || 'Active'}
                   </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
