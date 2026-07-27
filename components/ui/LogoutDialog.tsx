'use client';

import { LogOut } from 'lucide-react';
import Dialog from './Dialog';
import Button from './Button';

interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutDialog({ isOpen, onClose, onConfirm }: LogoutDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="!max-w-[320px]">
      <div className="flex flex-col items-center text-center">
        {/* Android Icon Style */}
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-5 border border-white/5">
          <LogOut className="text-[#E46767] w-8 h-8" />
        </div>

        <h3 className="text-[22px] font-bold text-white mb-2 tracking-tight">Logout</h3>
        <p className="text-[#666666] text-[16px] leading-relaxed mb-8">
          Are you sure you want to log out of your account?
        </p>

        <div className="flex w-full gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-14 text-white font-bold text-[16px] active:opacity-70 transition-opacity"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-[1.2] h-14 bg-[#E46767] text-white font-bold rounded-[16px] text-[16px] shadow-lg shadow-red-500/10 active:scale-95 transition-transform"
          >
            Logout
          </button>
        </div>
      </div>
    </Dialog>
  );
}
