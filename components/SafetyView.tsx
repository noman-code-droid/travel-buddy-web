'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Shield, User, Plus, Phone } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';

interface SafetyViewProps {
  onClose: () => void;
}

export default function SafetyView({ onClose }: SafetyViewProps) {
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
        <h2 className="font-bold text-[20px]">Safety Dashboard</h2>
      </div>
      <div className="p-6 space-y-8 overflow-y-auto">
        <Card radius="3xl" className="p-8 flex flex-col items-center text-center space-y-6 border border-[#E4676740] bg-[#E4676710]">
          <div className="w-[100px] h-[100px] bg-[#E46767] rounded-full flex items-center justify-center shadow-lg shadow-[#E4676730]">
            <Shield className="text-white w-[50px] h-[50px]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-[22px] font-bold text-[#E46767]">SOS Emergency</h3>
            <p className="text-[14px] text-[#ABABAB]">Press in case of danger. We will notify the police and your trusted contacts immediately.</p>
          </div>
          <Button variant="destructive" className="h-[64px] rounded-full text-[18px]">
            Activate SOS
          </Button>
        </Card>

        <div className="space-y-4">
          <h4 className="text-[14px] font-bold uppercase tracking-wider text-[#666666] ml-2">Trusted Contacts</h4>
          <div className="space-y-3">
            {[
              { name: 'Father', phone: '+92 300 1234567' },
              { name: 'Brother', phone: '+92 312 9876543' }
            ].map((contact, i) => (
              <Card key={i} radius="xl" className="p-5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-[#333333]">
                    <User className="w-6 h-6 text-[#ABABAB]" />
                  </div>
                  <div>
                    <p className="font-bold text-[16px]">{contact.name}</p>
                    <p className="text-[12px] text-[#ABABAB]">{contact.phone}</p>
                  </div>
                </div>
                <button className="w-10 h-10 bg-[#333333] rounded-full flex items-center justify-center active:scale-90 transition-transform">
                  <Phone className="w-5 h-5 text-[#FFD500]" />
                </button>
              </Card>
            ))}
            <button className="w-full border-2 border-dashed border-[#333333] rounded-[24px] p-5 text-[15px] text-[#ABABAB] flex items-center justify-center gap-2 active:bg-white/5 transition-colors">
              <Plus className="w-5 h-5" /> Add New Contact
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
