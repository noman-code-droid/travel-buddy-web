'use client';

import { Camera, Image as ImageIcon, X } from 'lucide-react';
import Dialog from './Dialog';

interface MediaPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (source: 'camera' | 'gallery') => void;
}

export default function MediaPickerDialog({ isOpen, onClose, onSelect }: MediaPickerDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-[340px] !p-0"
      showClose={false}
    >
      <div className="bg-[#212121] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-white tracking-tight">Choose Option</h3>
          <button onClick={onClose} className="text-[#666666] active:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-2">
          <button
            onClick={() => onSelect('camera')}
            className="flex flex-col items-center gap-3 p-6 rounded-[24px] bg-[#1A1A1A] border border-white/5 active:bg-white/5 transition-all group"
          >
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center group-active:scale-110 transition-transform">
              <Camera className="text-[#FFD500] w-7 h-7" />
            </div>
            <span className="text-sm font-bold text-[#ABABAB]">Camera</span>
          </button>

          <button
            onClick={() => onSelect('gallery')}
            className="flex flex-col items-center gap-3 p-6 rounded-[24px] bg-[#1A1A1A] border border-white/5 active:bg-white/5 transition-all group"
          >
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center group-active:scale-110 transition-transform">
              <ImageIcon className="text-[#FFD500] w-7 h-7" />
            </div>
            <span className="text-sm font-bold text-[#ABABAB]">Gallery</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
}
