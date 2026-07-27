'use client';

import { useState } from 'react';
import { Star, User, X } from 'lucide-react';
import Dialog from './Dialog';
import Button from './Button';

interface RateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetPhoto?: string;
  onSubmit: (score: number) => void;
}

export default function RateUserDialog({ isOpen, onClose, targetName, targetPhoto, onSubmit }: RateUserDialogProps) {
  const [rating, setRating] = useState(0);

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 bg-[#FFD50010] rounded-full flex items-center justify-center overflow-hidden border-2 border-[#FFD50020]">
          {targetPhoto ? (
            <img src={targetPhoto} alt={targetName} className="w-full h-full object-cover" />
          ) : (
            <User className="text-[#FFD500] w-10 h-10" />
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white">Rate Experience</h3>
          <p className="text-sm text-[#666666]">How was your trip with {targetName}?</p>
        </div>

        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="p-1 transition-transform active:scale-90"
            >
              <Star
                className={`w-10 h-10 ${
                  star <= rating ? 'text-[#FFD500] fill-[#FFD500]' : 'text-[#333333]'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex w-full gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 h-14 text-[#666666] font-bold text-[15px]"
          >
            Not Now
          </button>
          <Button
            onClick={() => onSubmit(rating)}
            disabled={rating === 0}
            className="flex-[1.5] !h-14 !rounded-[16px]"
          >
            Submit Rating
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
