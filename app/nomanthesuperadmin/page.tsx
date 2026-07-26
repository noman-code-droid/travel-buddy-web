'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '@/types';
import {
  CheckCircle,
  XCircle,
  User,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
  Trash2,
  ChevronRight,
  ShieldAlert,
  LogIn,
  UserCheck,
  BadgeCheck,
  Terminal,
  Image as ImageIcon,
  Database
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCredentialVerified, setIsCredentialVerified] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const router = useRouter();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthStatus('unauthenticated');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
          setAuthStatus('authenticated');
        } else {
          setIsAdmin(false);
          setAuthStatus('authenticated');
        }
      } catch (err) {
        setAuthStatus('unauthenticated');
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!isAdmin || !isCredentialVerified) return;

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
      setDataLoading(false);
    }, (error) => {
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, isCredentialVerified]);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const envUser = process.env.NEXT_PUBLIC_SUPER_ADMIN_USERNAME;
    const envPass = process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD;

    if (!envUser || !envPass) {
        setLoginError('Configuration missing.');
        return;
    }

    if (username === envUser && password === envPass) {
      setIsCredentialVerified(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials.');
    }
  };

  const handleUpdateStatus = async (uid: string, status: 'approved' | 'rejected', reason?: string) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        verificationStatus: status,
        rejectionReason: reason || '',
        verifiedAt: serverTimestamp(),
        userType: status === 'approved' ? 'driver' : 'passenger'
      });
      setSelectedUser(null);
      alert(`User status updated to ${status}`);
    } catch (error) {
      alert("Database error: update failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteApplication = async (uid: string) => {
    if (!confirm("Reset driver application?")) return;
    try {
      await updateDoc(doc(db, "users", uid), {
        isDriverApplied: false,
        verificationStatus: 'none',
        licenseUrl: null,
        licenseBackUrl: null,
        cnicUrl: null
      });
      setSelectedUser(null);
      alert("Application deleted.");
    } catch (error) { alert("Delete failed"); }
  };

  if (authStatus === 'loading') return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-6 text-white text-center">
      <Loader2 className="w-10 h-10 text-[#FFD500] animate-spin" />
      <p className="text-[#666666] font-bold uppercase tracking-[0.3em] text-[10px]">Authorizing Admin Session</p>
    </div>
  );

  if (authStatus === 'unauthenticated' || isAdmin === false) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white">
       <Card variant="flat" radius="3xl" className="p-12 border-white/5 bg-[#0A0A0A] max-w-[420px] shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-[#E46767] mx-auto mb-8" />
          <h2 className="text-xl font-bold uppercase italic mb-4 tracking-tighter text-white">Access Restricted</h2>
          <p className="text-[#666666] text-sm mb-12 leading-relaxed">
            {isAdmin === false ? "This account does not have Super Admin privileges." : "No active session detected. Please log in first."}
          </p>
          <Button onClick={() => router.push('/')} className="w-full !h-14 !rounded-[16px] font-bold uppercase tracking-widest text-xs">Exit Route</Button>
       </Card>
    </div>
  );

  if (!isCredentialVerified) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white">
      <Card variant="flat" radius="3xl" className="w-full max-w-[400px] p-10 border-white/5 shadow-2xl bg-[#080808]">
        <div className="flex flex-col items-center text-center space-y-6 mb-12">
           <div className="p-5 bg-[#FFD500] rounded-[24px] text-black shadow-xl">
              <UserCheck className="w-10 h-10" />
           </div>
           <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Identity Verified</h2>
              <p className="text-[#444444] text-[10px] font-black uppercase tracking-[0.2em]">Enter Admin Access Key</p>
           </div>
        </div>

        <form onSubmit={handleManualLogin} className="space-y-5">
          <Input label="System ID" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="!bg-black border-white/5" />
          <Input label="Access Key" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="!bg-black border-white/5" />
          {loginError && <p className="text-[#E46767] text-[10px] font-black uppercase text-center animate-shake">{loginError}</p>}
          <Button type="submit" className="w-full !h-14 !rounded-[16px] mt-4 font-black uppercase tracking-widest text-xs">Unlock Console</Button>
        </form>
      </Card>
    </div>
  );

  if (dataLoading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white text-center">
      <Loader2 className="w-10 h-10 text-[#FFD500] animate-spin mb-4" />
      <p className="text-[#444444] font-black uppercase tracking-[0.6em] text-[10px]">Syncing Encrypted Records</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10 max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8 border-b border-white/5 pb-8">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-[#444444] hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] group">
             <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Disconnect System
          </Link>
          <div className="flex items-center gap-5">
            <div className="p-4 bg-[#FFD500] rounded-[20px] text-black shadow-lg">
               <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
               <h1 className="text-3xl font-black tracking-tighter italic uppercase">Admin Dashboard</h1>
               <p className="text-[#666666] text-xs font-bold uppercase tracking-[0.4em] mt-1">Management Console</p>
            </div>
          </div>
        </div>

        <Card variant="flat" className="px-8 py-4 flex flex-col justify-center border-white/5 bg-black/40 backdrop-blur-xl text-center">
            <span className="text-[9px] font-black text-[#444444] uppercase mb-1 tracking-[0.2em]">Queue Volume</span>
            <span className="text-2xl font-black text-[#FFD500] block">{users.length}</span>
        </Card>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-[10px] font-black text-[#222222] uppercase tracking-[0.4em] mb-6 ml-2">Verification Stream</h2>
          <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
            {users.length === 0 ? (
              <div className="p-16 text-center border-2 border-dashed border-[#0A0A0A] rounded-[40px] bg-black/20">
                <p className="text-[#1A1A1A] text-[10px] font-black uppercase tracking-[0.3em]">Stream Clear</p>
              </div>
            ) : (
              users.map(u => (
                <button key={u.uid} onClick={() => setSelectedUser(u)} className="w-full text-left transition-all hover:translate-x-2 group">
                  <Card variant={selectedUser?.uid === u.uid ? 'active' : 'flat'} className="p-5 flex items-center justify-between border-white/5 bg-[#080808] group-hover:border-[#FFD500]/20">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center shrink-0 font-black ${u.verificationStatus === 'approved' ? 'bg-[#22C55E10] text-[#22C55E]' : 'bg-[#111111] text-[#FFD500]'}`}>
                        {u.name?.[0] || 'U'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm truncate text-white/90 uppercase tracking-tight">{u.name}</p>
                        <p className={`text-[9px] font-bold uppercase mt-1 tracking-widest ${u.verificationStatus === 'approved' ? 'text-[#22C55E]' : 'text-[#FFD500]'}`}>
                          {u.verificationStatus}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedUser?.uid === u.uid ? 'text-[#FFD500] translate-x-1' : 'text-[#0D0D0D]'}`} />
                  </Card>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Details Area */}
        <div className="lg:col-span-8">
          {selectedUser ? (
            <Card variant="flat" radius="3xl" className="p-10 sticky top-10 border-white/5 shadow-2xl bg-[#080808] overflow-hidden">
              <div className="flex justify-between items-start mb-12 relative">
                <div className="flex gap-8">
                  <div className="w-24 h-24 bg-[#111111] rounded-[32px] overflow-hidden border-4 border-black shadow-lg">
                    {selectedUser.photoUrl ? (
                        <img src={selectedUser.photoUrl} alt="P" className="w-full h-full object-cover" />
                    ) : (
                        <User className="text-black w-10 h-10 p-6" />
                    )}
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-3xl font-black tracking-tighter uppercase italic">{selectedUser.name}</h3>
                        {selectedUser.isAdmin && <BadgeCheck className="text-blue-500 w-5 h-5" />}
                    </div>
                    <p className="text-[#FFD500] font-black text-lg tracking-tight">{selectedUser.phone}</p>
                    <div className="flex gap-2 mt-4">
                       <span className="bg-[#22C55E10] text-[#22C55E] text-[10px] font-black px-3 py-1.5 rounded-full border border-[#22C55E20] uppercase">ID Verified</span>
                       <span className="bg-white/5 text-white/30 text-[10px] font-black px-3 py-1.5 rounded-full border border-white/5 font-mono uppercase italic">Ref: {selectedUser.uid.substring(0, 10)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDeleteApplication(selectedUser.uid)} className="p-3 bg-white/5 rounded-2xl text-[#E46767] hover:bg-[#E4676720] transition-all border border-white/5 shadow-xl"><Trash2 className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                <div className="space-y-8">
                   <h4 className="text-[10px] font-black text-[#222222] uppercase tracking-[0.4em]">Physical Assets</h4>
                   <div className="space-y-6">
                    <DetailItem label="Asset Model" value={`${selectedUser.vehicleMake} ${selectedUser.vehicleModel}`} />
                    <div className="p-6 bg-black rounded-[24px] border border-white/5 shadow-inner">
                        <DetailItem label="Official Plate" value={selectedUser.registrationNumber} className="text-[#FFD500] font-black text-xl tracking-tight" />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-[#222222] uppercase tracking-[0.4em]">Document Vault</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <ImagePreview label="License Front" url={selectedUser.licenseUrl} />
                    <ImagePreview label="License Back" url={selectedUser.licenseBackUrl} />
                    <ImagePreview label="Identity Card (CNIC)" url={selectedUser.cnicUrl} />
                  </div>
                </div>
              </div>

              <div className="flex gap-5 border-t border-white/5 pt-10">
                <Button variant="ghost" className="flex-1 !h-14 !rounded-[20px] border border-[#E4676720] !text-[#E46767] font-black uppercase text-[10px] hover:bg-[#E4676705]" onClick={() => { const r = prompt("Reason:"); if (r) handleUpdateStatus(selectedUser.uid, 'rejected', r); }} loading={actionLoading}>Reject</Button>
                <Button className="flex-1 !h-14 !rounded-[20px] !bg-[#22C55E] !text-black font-black uppercase text-[10px] shadow-lg shadow-green-500/10" onClick={() => handleUpdateStatus(selectedUser.uid, 'approved')} loading={actionLoading}>Confirm Approval</Button>
              </div>
            </Card>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-[#111111] rounded-[80px] bg-[#050505]">
              <div className="w-20 h-20 bg-[#080808] rounded-full flex items-center justify-center border border-white/5 mb-8 shadow-inner">
                  <Database className="w-8 h-8 text-[#1a1a1a]" />
              </div>
              <p className="text-[#222222] font-black uppercase tracking-[0.6em] text-[10px] italic text-center">Awaiting Operator Input</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, className = "" }: { label: string, value?: string, className?: string }) {
  return (
    <div>
      <p className="text-[9px] text-[#444444] font-black uppercase mb-1 tracking-widest">{label}</p>
      <p className={`text-base font-medium text-white/80 ${className}`}>{value || 'NULL_DATA'}</p>
    </div>
  );
}

function ImagePreview({ label, url }: { label: string, url?: string }) {
  if (!url) return (
    <div className="p-4 rounded-2xl border border-dashed border-white/5 flex flex-col items-center gap-2">
      <ImageIcon className="w-5 h-5 text-[#222222]" />
      <span className="text-[8px] font-black uppercase text-[#222222] tracking-widest">{label} Missing</span>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <p className="text-[8px] text-[#444444] font-black uppercase tracking-[0.2em]">{label}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#FFD500] hover:underline text-[8px] font-black uppercase">Full View</a>
      </div>
      <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/5 bg-black/50 group">
        <img src={url} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
           <ExternalLink className="text-white w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
