'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, MessageSquare, Shield, Bell } from 'lucide-react';
import { Notification } from '@/types';
import Card from './ui/Card';

interface NotificationsViewProps {
  onClose: () => void;
}

export default function NotificationsView({ onClose }: NotificationsViewProps) {
  const notifications: Notification[] = [
    { title: 'Ride Confirmed!', desc: 'Ahmed has accepted your ride request to University of Lahore.', time: '2 mins ago', type: 'success' },
    { title: 'New Message', desc: 'Driver: "I am near the gate, please be ready."', time: '15 mins ago', type: 'info' },
    { title: 'Safety Alert', desc: 'Share your live trip status with your trusted contacts.', time: '1 hour ago', type: 'alert' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-[#22C55E] w-6 h-6" />;
      case 'info': return <MessageSquare className="text-[#FFD500] w-6 h-6" />;
      case 'alert': return <Shield className="text-[#E46767] w-6 h-6" />;
      default: return <Bell className="text-white w-6 h-6" />;
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      <div className="p-4 flex items-center gap-4">
        <button onClick={onClose}><ArrowLeft className="text-white w-7 h-7" /></button>
        <h2 className="font-bold text-[20px]">Notifications</h2>
      </div>
      <div className="p-4 space-y-3 overflow-y-auto">
        {notifications.map((n, i) => (
          <Card key={i} variant="flat" radius="xl" className="p-5 flex gap-4 items-start shadow-sm">
            <div className="mt-1">{getIcon(n.type)}</div>
            <div className="space-y-1">
              <h4 className="font-bold text-[15px] text-white">{n.title}</h4>
              <p className="text-[12px] text-[#ABABAB] leading-relaxed">{n.desc}</p>
              <p className="text-[10px] text-[#666666] mt-1">{n.time}</p>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
