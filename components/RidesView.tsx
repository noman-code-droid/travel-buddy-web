'use client';

import { Clock } from 'lucide-react';
import { UserMode, RideHistory } from '@/types';
import Card from './ui/Card';

interface RidesViewProps {
  userMode: UserMode;
}

export default function RidesView({ userMode }: RidesViewProps) {
  const history: RideHistory[] = [
    { from: 'Home', to: 'Lahore Airport', date: 'Oct 24, 2023', price: 'RS 450', status: 'Completed' },
    { from: 'Office', to: 'Model Town', date: 'Oct 22, 2023', price: 'RS 280', status: 'Cancelled' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Your {userMode === 'passenger' ? 'Rides' : 'History'}</h2>
      <div className="space-y-4">
        {history.map((ride, i) => (
          <Card key={i} variant="flat" radius="xl" className="p-5 flex justify-between items-center shadow-sm">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-black rounded-[16px] border border-[#333333]">
                <Clock className="w-6 h-6 text-[#FFD500]" />
              </div>
              <div>
                <h4 className="font-bold text-[16px] truncate w-32 text-white">{ride.to}</h4>
                <p className="text-[12px] text-[#ABABAB]">{ride.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#FFD500] text-[16px]">{ride.price}</p>
              <p className={`text-[10px] uppercase font-bold mt-1 ${ride.status === 'Completed' ? 'text-[#22C55E]' : 'text-[#E46767]'}`}>
                {ride.status}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
