'use client';

import { motion } from 'framer-motion';
import { Edit2, X } from 'lucide-react';
import Dialog from './Dialog';

interface ProfilePictureViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  onEdit?: () => void;
  canEdit?: boolean;
}

export default function ProfilePictureViewerDialog({
  isOpen,
  onClose,
  photoUrl,
  onEdit,
  canEdit = false
}: ProfilePictureViewerDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="!bg-transparent !border-none !shadow-none !p-0 flex items-center justify-center"
      showClose={false}
    >
      <div className="relative group">
        {/* Full Screen Image Container */}
        <div className="w-[300px] h-[300px] bg-[#1A1A1A] rounded-full overflow-hidden border-4 border-[#FFD500] shadow-2xl relative">
          <img
            src={photoUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 text-white active:scale-90 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Edit Button - Floating Action Button style */}
        {canEdit && (
          <button
            onClick={onEdit}
            className="absolute bottom-4 right-4 w-14 h-14 bg-[#FFD500] rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform text-black"
          >
            <Edit2 className="w-6 h-6" />
          </button>
        )}
      </div>
    </Dialog>
  );
}
