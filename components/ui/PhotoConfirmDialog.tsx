'use client';

import { motion } from 'framer-motion';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
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
      className="!max-w-[400px] !p-0 overflow-hidden bg-[#0A0A0A]"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div className="text-left">
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Confirm Document</h3>
            <p className="text-[11px] font-bold text-[#666666] uppercase tracking-widest">Verify Clarity</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Photo Preview - Rectangular for Documents */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full aspect-[3/2] bg-[#111111] rounded-[24px] overflow-hidden border-2 border-[#FFD500]/20 shadow-2xl relative group">
            <img
              src={photoUrl}
              alt="Document Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none" />
          </div>

          <div className="mt-6 p-4 bg-[#FFD50005] border border-[#FFD50010] rounded-2xl flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-[#FFD50020] flex items-center justify-center">
              <Camera className="w-4 h-4 text-[#FFD500]" />
            </div>
            <p className="text-[12px] text-[#888888] font-medium leading-tight">
              Ensure all text is readable and the document is not blurry.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={onRetake}
            className="flex-1 h-14 bg-white/5 text-white font-bold rounded-[20px] flex items-center justify-center gap-2 active:bg-white/10 transition-all border border-white/5"
          >
            <RefreshCw className="w-4 h-4" />
            Retake
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 h-14 bg-[#FFD500] text-black font-black uppercase tracking-widest rounded-[20px] flex items-center justify-center gap-2 shadow-lg shadow-[#FFD500]/20 active:scale-95 transition-all"
          >
            <Check className="w-5 h-5" strokeWidth={3} />
            Confirm
          </button>
        </div>
      </div>
    </Dialog>
  );
}
