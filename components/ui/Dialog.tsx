'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
}

export default function Dialog({
  isOpen,
  onClose,
  title,
  children,
  className,
  showClose = false
}: DialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={cn(
              "bg-[#212121] rounded-[24px] p-6 w-full max-w-[320px] border border-[#333333] shadow-2xl relative overflow-hidden",
              className
            )}
          >
            {showClose && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 text-[#666666] active:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {title && (
              <h3 className="text-[20px] font-bold text-white mb-4 pr-8 tracking-tight">
                {title}
              </h3>
            )}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
