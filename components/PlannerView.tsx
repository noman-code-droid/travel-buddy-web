'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Sparkles, Clock, CheckCircle2, Bot, ChevronRight, Plane } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';

interface PlannerViewProps {
  onClose: () => void;
}

export default function PlannerView({ onClose }: PlannerViewProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    destination: '',
    interests: [] as string[],
    duration: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleGenerate = async () => {
    setLoading(true);
    setStep(4);
    // Simulate AI Generation
    setTimeout(() => {
      setResult(`Based on your interest in ${data.interests.join(', ')}, here is a ${data.duration} trip to ${data.destination}:\n\nDay 1: Arrival and local sightseeing...\nDay 2: Exploration of cultural sites...\nDay 3: Relaxation and departure.`);
      setStep(5);
      setLoading(false);
    }, 3000);
  };

  const toggleInterest = (interest: string) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      {/* Header (Matches activity_ai_trip_planner.xml) */}
      <div className="p-4 flex items-center gap-4">
        <button onClick={step === 5 ? onClose : prevStep} disabled={step === 4}>
          <ArrowLeft className="text-white w-7 h-7" />
        </button>
        <h2 className="font-bold text-[20px] flex-1 text-center mr-7">AI Trip Planner</h2>
      </div>

      {/* Progress Bar (Matches LinearProgressIndicator) */}
      <div className="w-full h-1 bg-[#212121]">
        <motion.div
          className="h-full bg-[#FFD500]"
          initial={{ width: 0 }}
          animate={{ width: `${step * 20}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Where to?</h3>
                <p className="text-[#ABABAB]">Enter your dream destination in Pakistan.</p>
              </div>
              <Input
                icon={<MapPin className="w-5 h-5" />}
                placeholder="e.g. Swat, Hunza, Skardu"
                value={data.destination}
                onChange={(e) => setData({...data, destination: e.target.value})}
              />
              <Button onClick={nextStep} disabled={!data.destination} className="mt-8">
                Next <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">What do you love?</h3>
                <p className="text-[#ABABAB]">Select your travel interests.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['Hiking', 'Food', 'History', 'Culture', 'Nature', 'Photography'].map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`p-4 rounded-[20px] border transition-all text-sm font-bold ${
                      data.interests.includes(interest)
                        ? 'bg-[#FFD500] border-[#FFD500] text-black'
                        : 'bg-[#212121] border-[#333333] text-white'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <Button onClick={nextStep} disabled={data.interests.length === 0} className="mt-8">
                Next <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">For how long?</h3>
                <p className="text-[#ABABAB]">Duration of your stay.</p>
              </div>
              <div className="space-y-3">
                {['2-3 Days', '5 Days', '1 Week', '2 Weeks'].map(dur => (
                  <button
                    key={dur}
                    onClick={() => setData({...data, duration: dur})}
                    className={`w-full p-5 rounded-[24px] border flex justify-between items-center transition-all ${
                      data.duration === dur
                        ? 'bg-[#FFD500] border-[#FFD500] text-black'
                        : 'bg-[#212121] border-[#333333] text-white'
                    }`}
                  >
                    <span className="font-bold">{dur}</span>
                    <Clock className={`w-5 h-5 ${data.duration === dur ? 'text-black' : 'text-[#ABABAB]'}`} />
                  </button>
                ))}
              </div>
              <Button onClick={handleGenerate} disabled={!data.duration} className="mt-8">
                Generate Itinerary <Sparkles className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 bg-[#FFD500] rounded-full animate-ping opacity-20 absolute" />
                <div className="w-24 h-24 bg-[#FFD500] rounded-full flex items-center justify-center relative">
                  <Bot className="text-black w-10 h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">AI is Crafting...</h3>
                <p className="text-[#ABABAB]">Designing your perfect trip to {data.destination}</p>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-[#FFD500]">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="text-xl font-bold">Itinerary Ready!</h3>
              </div>
              <Card variant="active" radius="2xl" className="p-6 whitespace-pre-wrap leading-relaxed text-sm">
                {result}
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => setStep(1)}>New Trip</Button>
                <Button onClick={onClose}>Done</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
