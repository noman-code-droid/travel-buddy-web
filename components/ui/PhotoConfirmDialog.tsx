'use client';

import { motion } from 'framer-motion';
import { Camera, RefreshCw, Check } from 'lucide-react';
import Dialog from './Dialog';
import Button from './Button';

interface PhotoConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  onConfirm: () => void;
  onRetake: () => void;
}

export default function PhotoConfirmDialog({
  isOpen,
  onClose,
  photoUrl,
  onConfirm,
  onRetake
}: PhotoConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-[360px]"
    >
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight">Confirm Photo</h3>
          <p className="text-sm text-[#666666]">Does this look clear enough for identification?</p>
        </div>

        <div className="w-[200px] h-[200px] bg-[#1A1A1A] rounded-full overflow-hidden border-4 border-[#FFD500]/20 shadow-2xl relative">
          <img
            src={photoUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex w-full gap-3 pt-4">
          <button
            onClick={onRetake}
            className="flex-1 h-14 bg-white/5 text-white font-bold rounded-[20px] flex items-center justify-center gap-2 active:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retake
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 h-14 bg-[#FFD500] text-black font-black uppercase tracking-widest rounded-[20px] flex items-center justify-center gap-2 shadow-lg shadow-[#FFD500]/10 active:scale-95 transition-transform"
          >
            <Check className="w-5 h-5" strokeWidth={3} />
            Confirm
          </button>
        </div>
      </div>
    </Dialog>
  );
}
