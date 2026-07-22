'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Bot, Sparkles, ChevronRight } from 'lucide-react';

interface OnboardingViewProps {
  onComplete: () => void;
}

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(0);
  const slides = [
    { title: "Find Shared Rides Easily", desc: "Connect with verified drivers and save on your daily commute costs.", icon: <Car className="w-16 h-16 text-[#FFD500]" /> },
    { title: "AI Travel Assistant", desc: "Your personal smart companion for trip planning and safety advice.", icon: <Bot className="w-16 h-16 text-[#FFD500]" /> },
    { title: "Travel Smarter Together", desc: "Safe, affordable, and social rides across all major cities in Pakistan.", icon: <Sparkles className="w-16 h-16 text-[#FFD500]" /> }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black flex flex-col p-6">
      <div className="flex justify-end p-4">
        <button onClick={onComplete} className="text-[#ABABAB] text-[16px] p-3">Skip</button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-8">
        <motion.div key={step} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-32 h-32 bg-[#212121] rounded-full flex items-center justify-center border border-[#333333]">
          {slides[step].icon}
        </motion.div>
        <div className="space-y-4">
          <h2 className="text-[24px] font-bold text-white">{slides[step].title}</h2>
          <p className="text-[#ABABAB] text-[16px] leading-relaxed">{slides[step].desc}</p>
        </div>
      </div>
      <div className="space-y-8 pb-8">
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#FFD500]' : 'w-2 bg-[#333333]'}`} />)}
        </div>
        <button onClick={handleNext} className="android-btn-primary">
          <span className="text-[20px] font-bold">{step === slides.length - 1 ? "Get Started" : "Next"}</span>
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
}
