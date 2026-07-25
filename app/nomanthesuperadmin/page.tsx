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
  Terminal
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

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const router = useRouter();

  // 1. Secure Authentication Gate (Firebase Layer)
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
        console.error("Critical Auth Error:", err);
        setAuthStatus('unauthenticated');
      }
    });

    return () => unsubAuth();
  }, []);

  // 2. Real-time Data Sync (Locked behind both security layers)
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
      console.error("Firestore sync failed:", error);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, isCredentialVerified]);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const envUser = process.env.NEXT_PUBLIC_SUPER_ADMIN_USERNAME;
    const envPass = process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD;

    if (!envUser || !envPass) {
        setLoginError('Server configuration missing. Check Vercel Env Vars.');
        return;
    }

    if (username === envUser && password === envPass) {
      setIsCredentialVerified(true);
      setLoginError('');
    } else {
      setLoginError('Access Denied: Invalid System Credentials.');
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
    if (!confirm("Are you sure? This will reset the driver's application record.")) return;
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
    } catch (error) { alert("Delete operation failed."); }
  };

  // UI STATE: 1. AUTH LOADING
  if (authStatus === 'loading') return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-6 text-white">
      <Loader2 className="w-12 h-12 text-[#FFD500] animate-spin" />
      <p className="text-[#666666] font-bold uppercase tracking-[0.4em] text-[10px]">Authorizing Admin Session</p>
    </div>
  );

  // UI STATE: 2. UNAUTHORIZED
  if (authStatus === 'unauthenticated' || isAdmin === false) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white">
       <Card variant="flat" radius="3xl" className="p-12 border-white/5 bg-[#0A0A0A] max-w-[450px] shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-[#E46767] mx-auto mb-8" />
          <h2 className="text-3xl font-black uppercase italic mb-4 tracking-tighter">Security Block</h2>
          <p className="text-[#666666] text-sm mb-12 leading-relaxed">
            {isAdmin === false
              ? "Your account exists but is missing 'isAdmin' authorization in Firestore."
              : "No active Firebase session detected. Log in through the app first."}
          </p>
          <Button onClick={() => router.push('/')} className="w-full !h-16 !rounded-[24px] font-black uppercase tracking-widest text-xs">Return to Dashboard</Button>
       </Card>
    </div>
  );

  // UI STATE: 3. MANUAL CREDENTIAL GATE
  if (!isCredentialVerified) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white">
      <Card variant="flat" radius="3xl" className="w-full max-w-[440px] p-12 border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.8)] bg-[#080808]">
        <div className="flex flex-col items-center text-center space-y-6 mb-12">
           <div className="p-5 bg-[#FFD500] rounded-[32px] text-black">
              <Terminal className="w-10 h-10" />
           </div>
           <div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-1">Secondary Gate</h2>
              <p className="text-[#444444] text-[10px] font-black uppercase tracking-[0.2em]">Enter Admin Access Key</p>
           </div>
        </div>

        <form onSubmit={handleManualLogin} className="space-y-5">
          <Input label="System ID" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input label="Access Key" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          {loginError && <p className="text-[#E46767] text-[10px] font-black uppercase text-center">{loginError}</p>}
          <Button type="submit" className="w-full !h-16 !rounded-[20px] mt-4 font-black uppercase tracking-widest text-xs">Unlock Console</Button>
        </form>
      </Card>
    </div>
  );

  // UI STATE: 4. DATA LOADING
  if (dataLoading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="w-16 h-1 bg-[#111111] rounded-full overflow-hidden mb-6">
         <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1 }} className="w-full h-full bg-[#FFD500]" />
      </div>
      <p className="text-[#444444] font-black uppercase tracking-[0.6em] text-[10px]">Syncing Encrypted Records</p>
    </div>
  );

  // UI STATE: 5. MAIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-b border-white/5 pb-12">
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[#333333] hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] group">
             <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Disconnect System
          </Link>
          <div className="flex items-center gap-5">
            <div className="p-5 bg-[#FFD500] rounded-[32px] text-black shadow-2xl">
               <ShieldCheck className="w-10 h-10" />
            </div>
            <div>
               <h1 className="text-5xl font-black tracking-tighter italic uppercase">Management Portal</h1>
               <p className="text-[#666666] text-xs font-bold uppercase tracking-[0.5em] mt-2">Authenticated System Access</p>
            </div>
          </div>
        </div>

        <Card variant="flat" className="px-10 py-6 border-white/5 bg-black/40 backdrop-blur-xl text-center shadow-xl">
            <span className="text-[10px] font-black text-[#444444] uppercase mb-1 tracking-[0.2em]">Queue Volume</span>
            <span className="text-4xl font-black text-[#FFD500] block">{users.length}</span>
        </Card>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[11px] font-black text-[#222222] uppercase tracking-[0.4em] mb-8 ml-2">Verification Stream</h2>
          {users.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-[#0A0A0A] rounded-[60px] bg-black/20">
              <p className="text-[#1A1A1A] text-[10px] font-black uppercase tracking-[0.3em]">Stream Clear</p>
            </div>
          ) : (
            users.map(u => (
              <button key={u.uid} onClick={() => setSelectedUser(u)} className="w-full text-left transition-all hover:translate-x-2 group">
                <Card variant={selectedUser?.uid === u.uid ? 'active' : 'flat'} className="p-6 flex items-center justify-between border-white/5 bg-[#080808] group-hover:border-[#FFD500]/20">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center shrink-0 font-black text-lg ${u.verificationStatus === 'approved' ? 'bg-[#22C55E10] text-[#22C55E]' : 'bg-[#111111] text-[#FFD500]'}`}>
                      {u.name?.[0] || 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-sm truncate text-white/90 group-hover:text-white uppercase tracking-tight">{u.name}</p>
                      <p className={`text-[10px] font-black uppercase mt-1 tracking-widest ${u.verificationStatus === 'approved' ? 'text-[#22C55E]' : 'text-[#FFD500]'}`}>
                        {u.verificationStatus}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${selectedUser?.uid === u.uid ? 'text-[#FFD500] translate-x-1' : 'text-[#0D0D0D]'}`} />
                </Card>
              </button>
            ))
          )}
        </div>

        {/* Right Details Area */}
        <div className="lg:col-span-8">
          {selectedUser ? (
            <Card variant="flat" radius="3xl" className="p-16 sticky top-12 border-white/5 shadow-2xl bg-[#080808] overflow-hidden">
              <div className="flex justify-between items-start mb-16 relative">
                <div className="flex gap-10">
                  <div className="w-32 h-32 bg-[#111111] rounded-[60px] flex items-center justify-center overflow-hidden border-4 border-black shadow-2xl shrink-0">
                    {selectedUser.photoUrl ? (
                        <img src={selectedUser.photoUrl} alt="P" className="w-full h-full object-cover" />
                    ) : (
                        <User className="text-black w-14 h-14" />
                    )}
                  </div>
                  <div className="pt-4">
                    <h3 className="text-6xl font-black tracking-tighter uppercase italic">{selectedUser.name}</h3>
                    <p className="text-[#FFD500] font-black text-2xl tracking-tight">{selectedUser.phone}</p>
                    <div className="flex gap-3 mt-6">
                       <span className="bg-[#22C55E10] text-[#22C55E] text-[11px] font-black px-5 py-2 rounded-full border border-[#22C55E20] uppercase tracking-widest">ID AUTHENTICATED</span>
                       <span className="bg-white/5 text-white/30 text-[10px] font-black px-5 py-2 rounded-full border border-white/5 font-mono uppercase italic">Ref: {selectedUser.uid.substring(0, 10)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => { if(confirm("Purge application?")) handleUpdateStatus(selectedUser.uid, 'none' as any); }} className="p-5 bg-white/5 rounded-[32px] text-[#E46767] hover:bg-[#E4676720] transition-all border border-white/5 shadow-xl"><Trash2 className="w-7 h-7" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-20">
                <div className="space-y-10">
                   <h4 className="text-[12px] font-black text-[#222222] uppercase tracking-[0.5em]">Physical Assets</h4>
                   <div className="space-y-8">
                    <DetailItem label="Asset Model" value={`${selectedUser.vehicleMake} ${selectedUser.vehicleModel}`} />
                    <div className="p-8 bg-black rounded-[48px] border border-white/5 shadow-inner">
                        <DetailItem label="Official Plate" value={selectedUser.registrationNumber} className="text-[#FFD500] font-black text-3xl tracking-tight" />
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <h4 className="text-[12px] font-black text-[#222222] uppercase tracking-[0.5em]">Evidence Vault</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <DocLink label="License (Front)" url={selectedUser.licenseUrl} />
                    <DocLink label="License (Back)" url={selectedUser.licenseBackUrl} />
                    <DocLink label="National ID Card (CNIC)" url={selectedUser.cnicUrl} />
                  </div>
                </div>
              </div>

              <div className="flex gap-8 border-t border-white/5 pt-16">
                <Button variant="ghost" className="flex-1 !h-24 !rounded-[40px] border border-[#E4676720] !text-[#E46767] font-black uppercase tracking-[0.2em] text-sm hover:bg-[#E4676705]" onClick={() => { const r = prompt("Reason:"); if (r) handleUpdateStatus(selectedUser.uid, 'rejected', r); }} loading={actionLoading}>Reject</Button>
                <Button className="flex-1 !h-24 !rounded-[40px] !bg-[#22C55E] !text-black font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-green-500/20" onClick={() => handleUpdateStatus(selectedUser.uid, 'approved')} loading={actionLoading}>Confirm Approval</Button>
              </div>
            </Card>
          ) : (
            <div className="h-[800px] flex flex-col items-center justify-center border-2 border-dashed border-[#111111] rounded-[100px] bg-[#050505]">
              <Lock className="w-16 h-16 text-[#0D0D0D] mb-8 shadow-inner" />
              <p className="text-[#222222] font-black uppercase tracking-[0.8em] text-[12px] italic text-center">Awaiting Operator Input</p>
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
      <p className="text-[10px] text-[#444444] font-black uppercase mb-2 tracking-[0.2em]">{label}</p>
      <p className={`text-xl font-medium text-white/80 ${className}`}>{value || 'NULL_FIELD'}</p>
    </div>
  );
}

function DocLink({ label, url }: { label: string, url?: string }) {
  return (
    <a href={url || '#'} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-8 rounded-[40px] border transition-all ${url ? 'bg-[#0A0A0A] border-white/5 hover:border-[#FFD500] hover:bg-black text-white' : 'bg-transparent border-white/5 text-[#111111] pointer-events-none'}`}>
      <div className="flex items-center gap-5">
        <FileText className="w-6 h-6 text-[#FFD500]" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      {url && <ExternalLink className="w-4 h-4 text-[#FFD500]" />}
    </a>
  );
}
