'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, TrendingUp, Star, ArrowRight } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';

interface RideSummaryViewProps {
  onClose: () => void;
  rideData: any;
}

export default function RideSummaryView({ onClose, rideData }: RideSummaryViewProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute inset-0 bg-black z-[90] flex flex-col p-6 items-center justify-center text-center"
    >
      <div className="w-20 h-20 bg-[#22C55E20] rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="text-[#22C55E] w-12 h-12" />
      </div>

      <h1 className="text-3xl font-black text-white mb-2">Ride Completed!</h1>
      <p className="text-[#ABABAB] text-sm mb-8">Hope you had a safe journey with Travel Buddy.</p>

      <Card variant="flat" radius="2xl" className="w-full p-6 space-y-6 mb-8">
        <div className="flex justify-between items-center border-b border-[#333333] pb-4">
          <div className="text-left">
            <p className="text-[10px] font-bold text-[#666666] uppercase">Total Paid</p>
            <p className="text-xl font-black text-[#FFD500]">RS {rideData?.totalPrice || 0}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-[#22C55E] uppercase">You Saved</p>
            <p className="text-xl font-black text-[#22C55E]">RS {rideData?.savings || 0}</p>
          </div>
        </div>

        <div className="flex gap-4 text-left">
          <div className="flex flex-col items-center py-1">
            <div className="w-2 h-2 rounded-full bg-[#FFD500]" />
            <div className="w-px flex-1 bg-[#333333] my-1" />
            <div className="w-2 h-2 rounded-full bg-[#E46767]" />
          </div>
          <div className="flex-1 text-xs space-y-3">
            <p className="text-white font-medium truncate">{rideData?.pickupLocation}</p>
            <p className="text-white font-medium truncate">{rideData?.dropOffLocation}</p>
          </div>
        </div>
      </Card>

      <div className="w-full space-y-4">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-bold text-white">Rate your experience</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-8 h-8 text-[#FFD500] fill-[#FFD500]" />
            ))}
          </div>
        </div>

        <Button onClick={onClose} className="mt-8">
          Back to Home <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
