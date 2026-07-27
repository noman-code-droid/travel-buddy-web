'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  User,
  Plus,
  Phone,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Navigation,
  Sparkles
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import { TrustedContact } from '@/types';

interface SafetyViewProps {
  onClose: () => void;
  contacts: TrustedContact[];
  loadingContacts: boolean;
  onAddContact: (name: string, phone: string) => Promise<void>;
}

export default function SafetyView({ onClose, contacts, loadingContacts, onAddContact }: SafetyViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSOS = () => {
    setSosLoading(true);
    // Simulating Android SOS alert behavior
    setTimeout(() => {
        alert("SOS Alert Broadcasted to Guardians!");
        setSosLoading(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPhone.startsWith('03') && !newPhone.startsWith('+92')) {
        setError('ENTER VALID PAKISTANI NUMBER');
        return;
    }

    setAdding(true);
    try {
      await onAddContact(newName, newPhone);
      setNewName('');
      setNewPhone('');
      setShowAddModal(false);
    } catch (error) {
      alert("Failed to add contact");
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      {/* Header - Matches activity_trusted_contacts.xml */}
      <div className="bg-black z-20 px-2 py-3 flex items-center justify-between border-b border-[#333333]">
        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center active:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="text-white w-7 h-7 rotate-180" />
        </button>
        <h2 className="text-[20px] font-bold text-white flex-1 text-center pr-12">Trusted Contacts</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">

        {/* Safety Network Box - Matches activity_trusted_contacts.xml design */}
        <div className="bg-[#FFD50010] border border-[#FFD50020] rounded-[24px] p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-[#FFD500] rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
            <Shield className="text-black w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[16px] font-bold text-white uppercase tracking-tight">Your Safety Network</h3>
            <p className="text-[12px] text-[#ABABAB] leading-relaxed font-medium">
              Add trusted contacts who can receive real-time trip updates and SOS alerts.
            </p>
          </div>
        </div>

        {/* SOS Action Card - Premium design */}
        <div className="android-card-elevated p-8 flex flex-col items-center text-center space-y-6 border border-[#E4676740] bg-[#E4676705]">
          <div className="w-[80px] h-[80px] bg-[#E46767] rounded-[28px] flex items-center justify-center shadow-[0_10px_40px_rgba(228,103,103,0.3)]">
            <AlertTriangle className="text-white w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-[22px] font-black text-white italic uppercase tracking-tighter">Emergency SOS</h3>
            <p className="text-[13px] text-[#666666] font-medium max-w-[240px]">
              Instantly broadcast your live location to all guardians in your circle.
            </p>
          </div>
          <button
            onClick={handleSOS}
            disabled={sosLoading}
            className="w-full h-[72px] bg-[#E46767] text-white font-black rounded-full text-[18px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform"
          >
            {sosLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Activate SOS"}
          </button>
        </div>

        {/* Add Contact - Matches activity_trusted_contacts.xml btnAddContact */}
        <div className="space-y-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="android-btn-primary !h-[60px] !rounded-[30px]"
          >
            <Plus className="w-6 h-6" />
            <span>Add Trusted Contact</span>
          </button>

          {/* Contact List - Matches item_trusted_contact.xml */}
          <div className="space-y-3">
            {loadingContacts ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#FFD500]" /></div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-16 opacity-20 flex flex-col items-center gap-4">
                <Shield className="w-12 h-12" />
                <p className="italic text-sm">No trusted contacts added yet</p>
              </div>
            ) : (
              contacts.map((contact) => (
                <div key={contact.id} className="android-card p-5 border border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black rounded-[18px] flex items-center justify-center border border-white/5">
                      <User className="w-6 h-6 text-[#FFD500]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[16px] text-white">{contact.name}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] font-black text-[#666666] uppercase tracking-widest">{contact.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${contact.phone}`} className="w-11 h-11 bg-white/5 rounded-full flex items-center justify-center active:bg-white/10 transition-colors">
                      <Phone className="w-5 h-5 text-[#FFD500]" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Safety Features List - Matches activity_trusted_contacts.xml bottom card */}
        <div className="android-card-elevated p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#FFD500]" />
                <h4 className="font-bold text-[16px] text-white">Safety Features</h4>
            </div>

            <div className="space-y-4">
                {[
                    "Share live trip location with guardians",
                    "Send instant SOS alerts in emergencies",
                    "Automatic notifications on trip start/end"
                ].map((feature, i) => (
                    <div key={i} className="flex gap-3 items-start">
                        <CheckCircle2 className="w-4 h-4 text-[#FFD500] mt-0.5 shrink-0" />
                        <p className="text-[13px] text-[#ABABAB] font-medium leading-tight">{feature}</p>
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* Add Contact Modal - Styled like Android Dialog */}
      <AnimatePresence>
        {showAddModal && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#212121] rounded-[32px] p-8 w-full border border-[#333333] shadow-2xl relative"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-6 top-6 p-2 text-[#666666]"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-[22px] font-bold text-white mb-8 tracking-tight">Add Guardian</h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Full Name"
                  placeholder="e.g. Brother"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="0300 1234567"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  required
                  type="tel"
                  error={error}
                />
                <div className="pt-4">
                  <Button type="submit" loading={adding} className="!rounded-[24px]">
                    Save Contact
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
