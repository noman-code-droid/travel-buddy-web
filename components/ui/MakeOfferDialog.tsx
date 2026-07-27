'use client';

import { useState } from 'react';
import { Plus, Minus, Info, ShieldCheck } from 'lucide-react';
import Dialog from './Dialog';
import Button from './Button';
import Input from './Input';

interface MakeOfferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  basePrice: number;
  maxSeats: number;
  onSubmit: (price: number, seats: number) => void;
}

export default function MakeOfferDialog({
  isOpen,
  onClose,
  basePrice,
  maxSeats,
  onSubmit
}: MakeOfferDialogProps) {
  const [proposedPrice, setProposedPrice] = useState(basePrice.toString());
  const [seatCount, setSeatCount] = useState(1);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-[360px] !p-0"
      showClose={false}
    >
      <div className="bg-[#212121] rounded-[24px] overflow-hidden flex flex-col">
        {/* Handle for Bottom Sheet look */}
        <div className="w-10 h-1 bg-[#333333] rounded-full mx-auto mt-4 mb-2" />

        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-[20px] font-bold text-white tracking-tight">Make an Offer</h3>
            <p className="text-[14px] text-[#666666] font-medium">Propose your price and seats for this ride.</p>
          </div>

          <div className="space-y-6 pt-2">
            {/* Price Input - Matches tilPrice in Android */}
            <div className="space-y-2">
              <label className="label-android">Proposed Price (PKR)</label>
              <div className="android-input-container !bg-[#1A1A1A] !border-none !py-4 h-[60px]">
                <span className="text-[#666666] font-black text-sm">RS</span>
                <input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  placeholder="Enter price per seat"
                  className="android-input font-bold text-[18px]"
                />
              </div>
            </div>

            {/* Seat Selector */}
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-bold text-white">Number of Seats</span>
              <div className="flex items-center gap-4 bg-black rounded-[20px] p-1.5 border border-white/5">
                <button
                  onClick={() => seatCount > 1 && setSeatCount(prev => prev - 1)}
                  className="w-10 h-10 flex items-center justify-center text-white/50 active:text-[#FFD500] transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-[18px] font-black text-white w-6 text-center">{seatCount}</span>
                <button
                  onClick={() => seatCount < maxSeats && setSeatCount(prev => prev + 1)}
                  className="w-10 h-10 flex items-center justify-center text-white/50 active:text-[#FFD500] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-black/20 p-4 rounded-2xl border border-white/[0.02] flex justify-between items-center">
                <span className="text-[12px] font-bold text-[#666666] uppercase tracking-widest">Total Proposal</span>
                <p className="text-[20px] font-black text-[#FFD500] tracking-tight italic">
                  RS {Number(proposedPrice || 0) * seatCount}
                </p>
            </div>

            {/* Identity Badge */}
            <div className="flex gap-4 items-center bg-[#FFD50008] p-4 rounded-2xl border border-[#FFD50015]">
                <ShieldCheck className="text-[#FFD500] w-5 h-5 shrink-0" />
                <p className="text-[11px] text-[#888888] leading-tight font-medium italic">
                    The driver can accept, decline, or counter your offer.
                </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button
              onClick={() => onSubmit(Number(proposedPrice), seatCount)}
              disabled={!proposedPrice || Number(proposedPrice) <= 0}
              className="android-btn-primary !h-[60px] !rounded-full shadow-lg shadow-[#FFD500]/10"
            >
              Send Offer
            </Button>
            <button
              onClick={onClose}
              className="h-12 text-[#666666] font-bold text-sm uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
