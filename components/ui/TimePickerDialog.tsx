'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Dialog from './Dialog';
import Button from './Button';

interface TimePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (time: string) => void;
  initialTime?: string;
}

export default function TimePickerDialog({
  isOpen,
  onClose,
  onConfirm,
  initialTime = "12:00"
}: TimePickerDialogProps) {
  const [hour, setHour] = useState(initialTime.split(':')[0] || "12");
  const [minute, setMinute] = useState(initialTime.split(':')[1] || "00");
  const [ampm, setAmPm] = useState("AM");

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleConfirm = () => {
    onConfirm(`${hour}:${minute} ${ampm}`);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-[340px] !p-0"
      showClose={false}
    >
      <div className="bg-[#212121] p-6 flex flex-col items-center">
        {/* Handle */}
        <div className="w-10 h-1 bg-[#333333] rounded-full mb-6" />

        <h3 className="text-[20px] font-bold text-white mb-8 tracking-tight">Select Departure Time</h3>

        <div className="flex items-center gap-4 mb-10 w-full justify-center">
          {/* Hour Scroll */}
          <div className="flex flex-col items-center gap-2 h-[150px] overflow-y-auto no-scrollbar snap-y snap-mandatory bg-black/20 rounded-2xl p-2 border border-white/5 w-16">
            {hours.map(h => (
              <button
                key={h}
                onClick={() => setHour(h)}
                className={`snap-center shrink-0 h-10 w-full flex items-center justify-center rounded-lg text-lg font-black transition-colors ${hour === h ? 'bg-[#FFD500] text-black shadow-lg' : 'text-[#444444]'}`}
              >
                {h}
              </button>
            ))}
          </div>

          <span className="text-3xl font-black text-[#FFD500]">:</span>

          {/* Minute Scroll */}
          <div className="flex flex-col items-center gap-2 h-[150px] overflow-y-auto no-scrollbar snap-y snap-mandatory bg-black/20 rounded-2xl p-2 border border-white/5 w-16">
            {minutes.filter(m => parseInt(m) % 5 === 0).map(m => (
              <button
                key={m}
                onClick={() => setMinute(m)}
                className={`snap-center shrink-0 h-10 w-full flex items-center justify-center rounded-lg text-lg font-black transition-colors ${minute === m ? 'bg-[#FFD500] text-black shadow-lg' : 'text-[#444444]'}`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* AM/PM */}
          <div className="flex flex-col gap-2 bg-black/20 rounded-2xl p-2 border border-white/5">
            {['AM', 'PM'].map(p => (
              <button
                key={p}
                onClick={() => setAmPm(p)}
                className={`h-10 px-4 flex items-center justify-center rounded-lg text-sm font-black transition-colors ${ampm === p ? 'bg-[#FFD500] text-black shadow-lg' : 'text-[#444444]'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleConfirm}
          className="android-btn-primary !h-[60px] !rounded-full shadow-xl shadow-[#FFD500]/10"
        >
          Confirm Time
        </Button>
      </div>
    </Dialog>
  );
}
