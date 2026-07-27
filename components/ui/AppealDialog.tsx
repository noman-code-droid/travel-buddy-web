'use client';

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import Dialog from './Dialog';
import Button from './Button';

interface AppealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (statement: string) => void;
  onReapply: () => void;
}

export default function AppealDialog({ isOpen, onClose, onSubmit, onReapply }: AppealDialogProps) {
  const [statement, setStatement] = useState('');

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Appeal Decision">
      <div className="space-y-6">
        <p className="text-[13px] text-[#ABABAB] leading-relaxed">
          You can either submit a statement for reconsideration or re-apply by updating your details.
        </p>

        <div className="space-y-2">
          <label className="label-android">Your Statement</label>
          <div className="android-input-container !bg-[#1A1A1A] !border-none h-[120px] items-start">
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Explain why we should reconsider..."
              className="android-input h-full resize-none py-1"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Button
            onClick={() => onSubmit(statement)}
            disabled={!statement.trim()}
            className="android-btn-primary !h-[56px] shadow-lg"
          >
            Submit Appeal
          </Button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-[#333333] flex-1" />
            <span className="text-[#666666] text-[10px] font-black uppercase">OR</span>
            <div className="h-px bg-[#333333] flex-1" />
          </div>

          <Button
            onClick={onReapply}
            variant="secondary"
            className="!h-[56px] border-[#FFD500]/20"
          >
            Re-apply (Update Data)
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
