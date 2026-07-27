'use client';

import { Trash2, Edit2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PostOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}

export default function PostOptionsMenu({ isOpen, onClose, onDelete, onEdit }: PostOptionsMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-16 right-4 z-[120] w-[180px] bg-[#212121] rounded-[16px] shadow-2xl border border-white/5 overflow-hidden"
          >
            <div className="flex flex-col">
              {onEdit && (
                <>
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-4 p-4 active:bg-white/5 transition-colors text-left"
                  >
                    <Edit2 className="w-5 h-5 text-white" />
                    <span className="text-[14px] font-bold text-white">Edit Post</span>
                  </button>
                  <div className="h-px bg-[#333333] mx-3" />
                </>
              )}

              <button
                onClick={onDelete}
                className="flex items-center gap-4 p-4 active:bg-white/5 transition-colors text-left"
              >
                <Trash2 className="w-5 h-5 text-[#E46767]" />
                <span className="text-[14px] font-bold text-[#E46767]">Delete Post</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
