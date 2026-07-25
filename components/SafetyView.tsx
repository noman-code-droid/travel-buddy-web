'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, User, Plus, Phone, X, Loader2, AlertTriangle } from 'lucide-react';
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

  /**
   * Senior Audit Note: WhatsApp API requires numbers in international format
   * without the leading zero or '+' symbol. For Pakistan, 03xx becomes 923xx.
   */
  const formatWhatsAppNumber = (phone: string) => {
    let cleaned = phone.replace(/\D/g, ''); // Remove all non-numeric characters
    if (cleaned.startsWith('03')) {
      return '92' + cleaned.substring(1);
    }
    if (cleaned.startsWith('3') && cleaned.length === 10) {
      return '92' + cleaned;
    }
    return cleaned;
  };

  const handleSOS = () => {
    setSosLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setSosLoading(false);
      return;
    }

    // Senior Engineering Check: Geolocation can hang. Adding a 10s timeout.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `🚨 *EMERGENCY SOS - TRAVEL BUDDY* 🚨\n\nI am in danger and need immediate assistance!\n\n📍 *My Live Location:* ${mapsUrl}\n\n📞 Please call 15 (Police) or 1122 (Ambulance) for me immediately!`;

        // Send to first contact or open general WhatsApp if empty
        const targetPhone = contacts.length > 0 ? formatWhatsAppNumber(contacts[0].phone) : '';
        const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
        setSosLoading(false);
      },
      (error) => {
        console.error("SOS Geolocation Error:", error);
        let errorMsg = "Could not get your location.";
        if (error.code === error.PERMISSION_DENIED) errorMsg = "Location access denied. Please enable GPS.";
        if (error.code === error.TIMEOUT) errorMsg = "GPS Timeout. Please try again in an open area.";

        alert(errorMsg);
        setSosLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    setAdding(true);
    try {
      await onAddContact(newName, newPhone);
      setNewName('');
      setNewPhone('');
      setShowAddModal(false);
    } catch (error) {
      console.error("Add Contact Error:", error);
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
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      <div className="p-4 flex items-center gap-4 border-b border-white/5">
        <button onClick={onClose} className="p-2 -ml-2 active:scale-90 transition-transform">
          <ArrowLeft className="text-white w-7 h-7" />
        </button>
        <h2 className="font-bold text-[20px]">Safety Dashboard</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">
        {/* SOS SECTION */}
        <Card radius="3xl" className="p-8 flex flex-col items-center text-center space-y-6 border border-[#E4676740] bg-[#E4676705] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#E4676720]">
             <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full bg-[#E46767]"
             />
          </div>

          <div className="w-[100px] h-[100px] bg-[#E46767] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(228,103,103,0.4)]">
            <Shield className="text-white w-[50px] h-[50px]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-[22px] font-black text-[#E46767] uppercase tracking-tighter">SOS Emergency</h3>
            <p className="text-[13px] text-[#ABABAB] leading-relaxed">
                Immediately broadcast an emergency alert with your **GPS coordinates** to your trusted contacts.
            </p>
          </div>
          <Button
            variant="destructive"
            className="h-[72px] rounded-[24px] text-[18px] font-black uppercase tracking-widest flex gap-3 shadow-xl"
            onClick={handleSOS}
            loading={sosLoading}
          >
            {!sosLoading && <AlertTriangle className="w-6 h-6" />}
            {sosLoading ? 'Scanning GPS...' : 'Activate SOS'}
          </Button>
        </Card>

        {/* TRUSTED CONTACTS SECTION */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#444444]">Guardian Circle</h4>
            {loadingContacts && <Loader2 className="w-4 h-4 animate-spin text-[#FFD500]" />}
          </div>

          <div className="space-y-3">
            {contacts.length === 0 && !loadingContacts ? (
              <div className="text-center py-10 border border-dashed border-[#222222] rounded-[32px]">
                 <p className="text-[11px] text-[#666666] font-bold uppercase italic">No guardians added</p>
              </div>
            ) : (
              contacts.map((contact) => (
                <Card key={contact.id} radius="2xl" className="p-5 flex justify-between items-center bg-[#0A0A0A] border border-white/5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#111111] rounded-2xl flex items-center justify-center border border-white/5">
                      <User className="w-5 h-5 text-[#FFD500]" />
                    </div>
                    <div>
                      <p className="font-bold text-[16px] text-white/90">{contact.name}</p>
                      <p className="text-[12px] text-[#666666] font-mono">{contact.phone}</p>
                    </div>
                  </div>
                  <a href={`tel:${contact.phone}`} className="w-11 h-11 bg-[#FFD50010] border border-[#FFD50020] rounded-full flex items-center justify-center active:scale-90 transition-transform">
                    <Phone className="w-5 h-5 text-[#FFD500]" />
                  </a>
                </Card>
              ))
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full border-2 border-dashed border-[#222222] rounded-[28px] p-6 text-[14px] text-[#666666] font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-colors active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> Add New Guardian
            </button>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111111] rounded-[40px] p-8 w-full border border-white/10 relative shadow-2xl"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute right-8 top-8 text-[#444444] hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-8">Add Guardian</h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Full Name"
                  placeholder="e.g. Father"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  className="!bg-black border-white/5"
                />
                <Input
                  label="Emergency Phone Number"
                  placeholder="0300 1234567"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  required
                  type="tel"
                  className="!bg-black border-white/5"
                />
                <Button type="submit" loading={adding} className="!rounded-[20px] !h-16 mt-6 font-black uppercase tracking-widest text-xs shadow-lg">
                  Verify & Save
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
