'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Dialog from './Dialog';
import Button from './Button';

interface DriverConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function DriverConsentDialog({ isOpen, onClose, onAccept }: DriverConsentDialogProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Driver Terms & Consent">
      <div className="space-y-6">
        <div className="bg-black/40 rounded-2xl p-4 max-h-[200px] overflow-y-auto border border-white/5 space-y-4">
          <p className="text-[13px] text-[#ABABAB] leading-relaxed">
            By clicking 'I Agree', you confirm that:
          </p>
          <ul className="text-[12px] text-[#888888] space-y-3 list-disc pl-4 leading-snug">
            <li>You possess a valid and current driver's license in Pakistan.</li>
            <li>You own or are authorized to drive the vehicle used for rides.</li>
            <li>You will maintain valid vehicle insurance at all times.</li>
            <li>You agree to undergo a background check if required by the Travel Buddy safety protocol.</li>
            <li>You will comply with all local traffic laws and safety regulations.</li>
            <li>You understand that your driver status can be revoked for violating community standards or safety reports.</li>
          </ul>
        </div>

        <div className="flex items-center gap-3 px-1">
          <input
            type="checkbox"
            id="consent"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 accent-[#FFD500] bg-[#212121] border-[#333333] rounded"
          />
          <label htmlFor="consent" className="text-[14px] text-white font-medium cursor-pointer">
            I agree to the terms and conditions
          </label>
        </div>

        <div className="flex w-full gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-14 text-white font-bold text-[15px]"
          >
            Decline
          </button>
          <Button
            onClick={onAccept}
            disabled={!agreed}
            className="flex-[1.5] !h-14 !rounded-[16px] uppercase tracking-widest font-black"
          >
            I Agree
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
