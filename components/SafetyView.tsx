'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, User, Plus, Phone, X, Loader2 } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';

interface SafetyViewProps {
  onClose: () => void;
  contacts: any[];
  loadingContacts: boolean;
  onAddContact: (name: string, phone: string) => Promise<void>;
}

export default function SafetyView({ onClose, contacts, loadingContacts, onAddContact }: SafetyViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      <div className="p-4 flex items-center gap-4">
        <button onClick={onClose}><ArrowLeft className="text-white w-7 h-7" /></button>
        <h2 className="font-bold text-[20px]">Safety Dashboard</h2>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto pb-24">
        <Card radius="3xl" className="p-8 flex flex-col items-center text-center space-y-6 border border-[#E4676740] bg-[#E4676710]">
          <div className="w-[100px] h-[100px] bg-[#E46767] rounded-full flex items-center justify-center shadow-lg shadow-[#E4676730]">
            <Shield className="text-white w-[50px] h-[50px]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-[22px] font-bold text-[#E46767]">SOS Emergency</h3>
            <p className="text-[14px] text-[#ABABAB]">Press in case of danger. We will notify the police and your trusted contacts immediately.</p>
          </div>
          <Button variant="destructive" className="h-[64px] rounded-full text-[18px]">
            Activate SOS
          </Button>
        </Card>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[14px] font-bold uppercase tracking-wider text-[#666666]">Trusted Contacts</h4>
            {loadingContacts && <Loader2 className="w-4 h-4 animate-spin text-[#FFD500]" />}
          </div>

          <div className="space-y-3">
            {contacts.length === 0 && !loadingContacts ? (
              <p className="text-xs text-[#666666] text-center py-4 italic">No trusted contacts added yet.</p>
            ) : (
              contacts.map((contact) => (
                <Card key={contact.id} radius="xl" className="p-5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-[#333333]">
                      <User className="w-6 h-6 text-[#ABABAB]" />
                    </div>
                    <div>
                      <p className="font-bold text-[16px]">{contact.name}</p>
                      <p className="text-[12px] text-[#ABABAB]">{contact.phone}</p>
                    </div>
                  </div>
                  <a href={`tel:${contact.phone}`} className="w-10 h-10 bg-[#333333] rounded-full flex items-center justify-center active:scale-90 transition-transform">
                    <Phone className="w-5 h-5 text-[#FFD500]" />
                  </a>
                </Card>
              ))
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full border-2 border-dashed border-[#333333] rounded-[24px] p-5 text-[15px] text-[#ABABAB] flex items-center justify-center gap-2 active:bg-white/5 transition-colors"
            >
              <Plus className="w-5 h-5" /> Add New Contact
            </button>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#212121] rounded-[32px] p-6 w-full border border-[#333333] relative"
            >
              <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-6 text-[#666666]">
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-xl font-bold mb-6">Add Contact</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name"
                  placeholder="e.g. Father"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="+92 300 1234567"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  required
                />
                <Button type="submit" loading={adding} className="!rounded-[16px] !h-14 mt-4">
                  Save Contact
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
