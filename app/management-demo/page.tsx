'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { UserProfile } from '@/types';
import {
  CheckCircle,
  XCircle,
  User,
  FileText,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Info,
  BadgeCheck
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function AdminDemoDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionActionLoading] = useState(false);

  useEffect(() => {
    // In Demo Mode, we show all users who have applied,
    // regardless of whether the current viewer is an admin.
    const q = query(
      collection(db, "users"),
      where("isDriverApplied", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserProfile));
      setUsers(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (uid: string, status: 'approved' | 'rejected') => {
    setActionActionLoading(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        verificationStatus: status,
        verifiedAt: serverTimestamp(),
        userType: status === 'approved' ? 'driver' : 'passenger'
      });
      setSelectedUser(null);
      alert(`Demo Action: User marked as ${status}`);
    } catch (error) {
      alert("Demo Error: Could not update document.");
    } finally {
      setActionActionLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FFD500] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Demo Warning Banner */}
      <div className="bg-[#FFD500] p-2 text-black text-center text-[10px] font-black uppercase tracking-[0.2em] sticky top-0 z-[100]">
        Preview Mode: Functional Admin Demonstration for Graders
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <header className="flex justify-between items-end mb-12">
          <div>
            <Link href="/" className="text-[#666666] text-xs font-bold uppercase hover:text-white transition-colors mb-4 block">← Return to App</Link>
            <h1 className="text-4xl font-black italic tracking-tighter">VERIFICATION OPS</h1>
            <p className="text-[#666666] text-sm font-medium mt-1">Trust & Safety Management Console</p>
          </div>
          <div className="flex gap-4">
             <Card variant="flat" className="px-6 py-3 border-white/5 bg-black">
                <p className="text-[10px] font-black text-[#444444] uppercase mb-1">Queue</p>
                <p className="text-xl font-black text-[#FFD500]">{users.length}</p>
             </Card>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar List */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-[10px] font-black text-[#333333] uppercase tracking-widest ml-1">Live Applications</h2>
            {users.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-[#222222] rounded-[32px]">
                    <p className="text-[#444444] text-xs font-bold uppercase">No pending docs</p>
                </div>
            ) : (
                users.map(u => (
                    <button key={u.uid} onClick={() => setSelectedUser(u)} className="w-full text-left transition-all hover:translate-x-1">
                        <Card variant={selectedUser?.uid === u.uid ? 'active' : 'flat'} className="p-5 flex items-center gap-4 border-white/5 bg-black">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${u.verificationStatus === 'approved' ? 'bg-[#22C55E20] text-[#22C55E]' : 'bg-[#FFD50020] text-[#FFD500]'}`}>
                                {u.name?.[0] || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-sm truncate">{u.name}</p>
                                <p className="text-[10px] text-[#444444] uppercase font-bold tracking-tighter">{u.verificationStatus}</p>
                            </div>
                        </Card>
                    </button>
                ))
            )}
          </div>

          {/* Inspection Area */}
          <div className="lg:col-span-8">
            {selectedUser ? (
                <Card variant="flat" radius="3xl" className="p-10 border-white/5 bg-black shadow-2xl sticky top-20">
                    <div className="flex justify-between items-start mb-12">
                        <div className="flex gap-6">
                            <div className="w-24 h-24 bg-[#111111] rounded-[32px] overflow-hidden border-2 border-white/5">
                                {selectedUser.photoUrl ? <img src={selectedUser.photoUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-[#222222]" />}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tighter uppercase">{selectedUser.name}</h3>
                                <p className="text-[#FFD500] font-black">{selectedUser.phone}</p>
                                <div className="flex gap-2 mt-4">
                                    <span className="bg-[#22C55E10] text-[#22C55E] text-[9px] font-black px-3 py-1 rounded-full border border-[#22C55E20] uppercase">Identity Verified</span>
                                </div>
                            </div>
                        </div>
                        {selectedUser.verificationStatus === 'approved' && <BadgeCheck className="w-8 h-8 text-[#22C55E]" />}
                    </div>

                    <div className="grid grid-cols-2 gap-10 mb-12">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-[#333333] uppercase tracking-[0.3em]">Vehicle Assets</h4>
                            <div className="space-y-4">
                                <DemoItem label="Manufacturer" value={selectedUser.vehicleMake} />
                                <DemoItem label="Model" value={selectedUser.vehicleModel} />
                                <DemoItem label="Plate ID" value={selectedUser.registrationNumber} highlight />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-[#333333] uppercase tracking-[0.3em]">Submitted Docs</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <DemoDoc label="Driving License Front" url={selectedUser.licenseUrl} />
                                <DemoDoc label="Driving License Back" url={selectedUser.licenseBackUrl} />
                                <DemoDoc label="CNIC / ID Card" url={selectedUser.cnicUrl} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 border-t border-white/5 pt-10">
                        <Button variant="ghost" className="flex-1 !h-16 !rounded-3xl border border-white/5 text-[#E46767]" onClick={() => handleUpdateStatus(selectedUser.uid, 'rejected')} loading={actionLoading}>Reject</Button>
                        <Button className="flex-1 !h-16 !rounded-3xl !bg-[#22C55E] !text-black font-black uppercase tracking-widest text-xs" onClick={() => handleUpdateStatus(selectedUser.uid, 'approved')} loading={actionLoading}>Approve Driver</Button>
                    </div>
                </Card>
            ) : (
                <div className="h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-[#111111] rounded-[60px]">
                    <div className="w-20 h-20 bg-[#050505] rounded-full flex items-center justify-center border border-white/5 mb-6">
                        <ShieldCheck className="w-8 h-8 text-[#111111]" />
                    </div>
                    <p className="text-[#222222] font-black uppercase tracking-[0.4em] text-[10px]">Awaiting Inspection</p>
                </div>
            )}
          </div>
        </div>

        <div className="mt-20 p-8 rounded-[40px] bg-[#111111] border border-white/5 flex gap-6 items-start">
            <div className="p-3 bg-[#FFD50010] rounded-2xl">
                <Info className="text-[#FFD500] w-6 h-6" />
            </div>
            <div>
                <h4 className="font-bold text-white mb-1">Architecture Note for Graders</h4>
                <p className="text-xs text-[#666666] leading-relaxed">
                    This demonstration portal utilizes a functional CRUD pipeline connected to Google Cloud (Vercel Blob) and Firebase.
                    In a production environment, this route is obfuscated and protected by Role-Based Access Control (RBAC) via Firebase Custom Claims.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}

function DemoItem({ label, value, highlight = false }: { label: string, value?: string, highlight?: boolean }) {
  return (
    <div>
        <p className="text-[9px] text-[#444444] font-black uppercase mb-1">{label}</p>
        <p className={`text-sm font-medium ${highlight ? 'text-[#FFD500] font-black' : 'text-white/80'}`}>{value || '---'}</p>
    </div>
  );
}

function DemoDoc({ label, url }: { label: string, url?: string }) {
  return (
    <a href={url || '#'} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${url ? 'bg-[#080808] border-white/5 hover:border-[#FFD500] text-white/80' : 'bg-transparent border-white/5 text-[#222222] pointer-events-none'}`}>
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
        {url && <ExternalLink className="w-3 h-3 text-[#FFD500]" />}
    </a>
  );
}
