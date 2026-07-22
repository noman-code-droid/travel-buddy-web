'use client';

import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

export default function SplashView() {
  return (
    <motion.div
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="w-[100px] h-[100px] bg-[#FFD500] rounded-[24px] flex items-center justify-center shadow-lg mb-6">
          <Car className="text-black w-[60px] h-[60px]" />
        </div>
        <h1 className="text-[36px] font-bold text-[#FFD500]">Travel Buddy</h1>
        <p className="text-[#ABABAB] text-[16px] mt-2">Your journey companion</p>
      </motion.div>
    </motion.div>
  );
}
