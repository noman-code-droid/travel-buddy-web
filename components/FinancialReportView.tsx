'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, TrendingUp, MapPin, Loader2, Calendar } from 'lucide-react';
import Card from './ui/Card';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

interface FinancialItem {
  id: string;
  date: string;
  pickup: string;
  dropoff: string;
  amount: number;
  impact: number;
  isDriver: boolean;
  timestamp: any;
}

interface FinancialReportViewProps {
  onClose: () => void;
}

export default function FinancialReportView({ onClose }: FinancialReportViewProps) {
  const [history, setHistory] = useState<FinancialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setStats] = useState({
    earnings: 0,
    savings: 0,
    trips: 0,
    distance: 0
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const fetchData = async () => {
      setLoading(true);
      const uid = auth.currentUser?.uid;

      try {
        // Fetch Driver Rides (Completed)
        const ridesQuery = query(
          collection(db, "rides"),
          where("driverId", "==", uid),
          where("status", "==", "completed")
        );

        // Fetch Passenger Bookings (Completed)
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("passengerId", "==", uid),
          where("status", "==", "completed")
        );

        const [ridesSnap, bookingsSnap] = await Promise.all([
          getDocs(ridesQuery),
          getDocs(bookingsQuery)
        ]);

        const items: FinancialItem[] = [];
        let totalEarnings = 0;
        let totalSavings = 0;
        let totalDistance = 0;

        ridesSnap.forEach(doc => {
          const data = doc.data();
          totalEarnings += data.totalRevenue || 0;
          totalDistance += data.distanceKm || 0;
          items.push({
            id: doc.id,
            date: data.timestamp?.toDate().toLocaleDateString() || data.departureDate,
            pickup: data.pickupLocation,
            dropoff: data.dropOffLocation,
            amount: data.totalRevenue || 0,
            impact: data.driverResult || 0,
            isDriver: true,
            timestamp: data.timestamp
          });
        });

        bookingsSnap.forEach(doc => {
          const data = doc.data();
          totalSavings += data.savings || 0;
          items.push({
            id: doc.id,
            date: data.timestamp?.toDate().toLocaleDateString() || "Recent",
            pickup: data.pickupLocation,
            dropoff: data.dropOffLocation,
            amount: data.totalPrice || 0,
            impact: data.savings || 0,
            isDriver: false,
            timestamp: data.timestamp
          });
        });

        items.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

        setHistory(items);
        setStats({
          earnings: totalEarnings,
          savings: totalSavings,
          trips: items.length,
          distance: totalDistance
        });
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[80] flex flex-col"
    >
      <header className="p-4 flex items-center gap-4 border-b border-[#333333]">
        <button onClick={onClose}><ArrowLeft className="text-white w-7 h-7" /></button>
        <h2 className="font-bold text-[20px]">Financial Report</h2>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Main Stats (activity_financial_report.xml parity) */}
        <div className="p-6 space-y-6">
          <Card className="p-8 bg-gradient-to-br from-[#FFD500] to-[#EAB308] text-black border-none">
            <p className="text-sm font-bold uppercase tracking-widest opacity-70">Lifetime Earnings</p>
            <h1 className="text-4xl font-black mt-1">PKR {summary.earnings.toLocaleString()}</h1>

            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-black/10 pt-6">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-60">Total Savings</p>
                <p className="text-lg font-bold">PKR {summary.savings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase opacity-60">Shared Distance</p>
                <p className="text-lg font-bold">{Math.round(summary.distance)} KM</p>
              </div>
            </div>
          </Card>

          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-[16px]">Trip History</h3>
            <span className="text-xs text-[#666666] font-medium">{summary.trips} Trips</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-[#FFD500]" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <Wallet className="w-12 h-12 mx-auto mb-4" />
                <p className="italic">No financial history yet.</p>
              </div>
            ) : (
              history.map((item) => (
                <Card key={item.id} variant="flat" radius="xl" className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          item.isDriver ? 'bg-[#FFD500] text-black' : 'bg-[#22C55E20] text-[#22C55E]'
                        }`}>
                          {item.isDriver ? 'DRIVER' : 'PASSENGER'}
                        </span>
                        <span className="text-[11px] text-[#666666] font-medium">{item.date}</span>
                      </div>
                      <p className="text-sm font-bold text-white max-w-[180px] truncate">{item.pickup}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#666666] uppercase">{item.isDriver ? 'Revenue' : 'Paid'}</p>
                      <p className="text-sm font-black text-white">PKR {item.amount}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-[#333333]">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />
                      <span className="text-xs text-[#ABABAB]">{item.isDriver ? 'Net Impact' : 'You Saved'}</span>
                    </div>
                    <p className={`font-bold text-sm ${item.impact >= 0 ? 'text-[#22C55E]' : 'text-[#3B82F6]'}`}>
                      PKR {Math.abs(item.impact)}
                    </p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
