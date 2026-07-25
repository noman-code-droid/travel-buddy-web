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
  UserCheck
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

  // 1. Secure Authentication Gate
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthStatus('unauthenticated');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        // AUDIT FIX: Handle case where user exists in Auth but not in Firestore yet
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

  // 2. Real-time Data Sync (Locked behind both layers)
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
    // SENIOR AUDIT: Strictly using process.env with NO hardcoded fallbacks in logic
    const envUser = process.env.NEXT_PUBLIC_SUPER_ADMIN_USERNAME;
    const envPass = process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD;

    if (!envUser || !envPass) {
        setLoginError('Server configuration missing. Check environment variables.');
        return;
    }

    if (username === envUser && password === envPass) {
      setIsCredentialVerified(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Access attempt logged.');
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
    } catch (error) {
      alert("Database write failure.");
    } finally {
      setActionLoading(false);
    }
  };

  // UI STATE: 1. AUTH LOADING
  if (authStatus === 'loading') return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-6 text-white">
      <Loader2 className="w-12 h-12 text-[#FFD500] animate-spin" />
      <p className="text-[#666666] font-bold uppercase tracking-[0.3em] text-[10px]">Authorizing Admin Session</p>
    </div>
  );

  // UI STATE: 2. UNAUTHORIZED
  if (authStatus === 'unauthenticated' || isAdmin === false) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center text-white">
       <Card variant="flat" radius="3xl" className="p-10 border-white/5 bg-[#0A0A0A] max-w-[400px] shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-[#E46767] mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">Security Block</h2>
          <p className="text-[#666666] text-sm mb-10 leading-relaxed">
            {isAdmin === false ? "This account does not have Super Admin privileges." : "No active session detected. Please log in to the app first."}
          </p>
          <Button onClick={() => router.push('/')} className="w-full !h-16 !rounded-[20px] font-black uppercase tracking-widest text-xs">Return to Terminal</Button>
       </Card>
    </div>
  );

  // UI STATE: 3. CREDENTIAL GATE
  if (!isCredentialVerified) return (
    <div className="h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-white">
      <Card variant="flat" radius="3xl" className="w-full max-w-[420px] p-12 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#080808]">
        <div className="flex flex-col items-center text-center space-y-6 mb-10">
           <div className="p-5 bg-[#FFD500] rounded-[32px] text-black shadow-[0_0_30px_rgba(255,213,0,0.1)]">
              <UserCheck className="w-10 h-10" />
           </div>
           <div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-1">Identity Confirmed</h2>
              <p className="text-[#444444] text-[10px] font-black uppercase tracking-[0.2em]">Secondary Clearance Required</p>
           </div>
        </div>

        <form onSubmit={handleManualLogin} className="space-y-5">
          <Input label="System ID" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="!bg-black border-white/5" />
          <Input label="Access Key" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="!bg-black border-white/5" />
          {loginError && <p className="text-[#E46767] text-[10px] font-black uppercase text-center animate-shake">{loginError}</p>}
          <Button type="submit" className="w-full !h-16 !rounded-[24px] mt-6 font-black uppercase tracking-widest text-xs shadow-xl shadow-yellow-500/5">Open Command Center</Button>
        </form>
      </Card>
    </div>
  );

  // UI STATE: 4. DATA LOADING
  if (dataLoading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="w-16 h-1 bg-[#111111] rounded-full overflow-hidden mb-4">
         <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1 }} className="w-full h-full bg-[#FFD500]" />
      </div>
      <p className="text-[#444444] font-black uppercase tracking-[0.4em] text-[10px]">Decrypting Database</p>
    </div>
  );

  // UI STATE: 5. DASHBOARD
  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 max-w-[1500px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8 border-b border-white/5 pb-12">
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[#333333] hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] group">
             <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Disconnect
          </Link>
          <div className="flex items-center gap-5">
            <div className="p-5 bg-[#FFD500] rounded-[32px] text-black shadow-2xl">
               <ShieldCheck className="w-10 h-10" />
            </div>
            <div>
               <h1 className="text-5xl font-black tracking-tighter italic uppercase">Admin Console</h1>
               <p className="text-[#666666] text-xs font-bold uppercase tracking-[0.5em] mt-2">Level 4 Authorization Active</p>
            </div>
          </div>
        </div>

        <Card variant="flat" className="px-10 py-6 border-white/5 bg-black/40 backdrop-blur-3xl text-center">
            <span className="text-[10px] font-black text-[#444444] uppercase mb-1 tracking-[0.2em]">Queue Volume</span>
            <span className="text-4xl font-black text-[#FFD500] block">{users.length}</span>
        </Card>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Feed */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[11px] font-black text-[#222222] uppercase tracking-[0.4em] mb-8 ml-2">Verification Stream</h2>
          {users.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-[#0A0A0A] rounded-[60px] bg-black/20">
              <p className="text-[#1A1A1A] text-[10px] font-black uppercase tracking-[0.3em]">Stream Empty</p>
            </div>
          ) : (
            users.map(u => (
              <button key={u.uid} onClick={() => setSelectedUser(u)} className="w-full text-left transition-all hover:translate-x-2 group">
                <Card variant={selectedUser?.uid === u.uid ? 'active' : 'flat'} className="p-6 flex items-center justify-between border-white/5 bg-[#080808]">
                  <div className="flex items-center gap-6">
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

        {/* Inspection Panel */}
        <div className="lg:col-span-8">
          {selectedUser ? (
            <Card variant="flat" radius="3xl" className="p-16 sticky top-12 border-white/5 shadow-2xl bg-[#080808] overflow-hidden">
              <div className="flex justify-between items-start mb-20 relative">
                <div className="flex gap-10">
                  <div className="w-40 h-40 bg-[#111111] rounded-[60px] overflow-hidden border-4 border-black shadow-2xl">
                    {selectedUser.photoUrl ? <img src={selectedUser.photoUrl} className="w-full h-full object-cover" /> : <User className="text-black w-14 h-14 p-12" />}
                  </div>
                  <div className="pt-6">
                    <h3 className="text-6xl font-black tracking-tighter uppercase italic mb-2">{selectedUser.name}</h3>
                    <p className="text-[#FFD500] font-black text-2xl tracking-tight">{selectedUser.phone}</p>
                    <div className="flex gap-3 mt-8">
                       <span className="bg-[#22C55E10] text-[#22C55E] text-[11px] font-black px-5 py-2 rounded-full border border-[#22C55E20] uppercase tracking-widest">ID AUTHENTICATED</span>
                       <span className="bg-white/5 text-white/30 text-[10px] font-black px-5 py-2 rounded-full border border-white/5 font-mono uppercase">REF: {selectedUser.uid.substring(0, 12)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => { if(confirm("Purge application?")) handleUpdateStatus(selectedUser.uid, 'none' as any); }} className="p-5 bg-white/5 rounded-[32px] text-[#E46767] hover:bg-[#E4676720] transition-all border border-white/5"><Trash2 className="w-7 h-7" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-20">
                <div className="space-y-10">
                   <h4 className="text-[12px] font-black text-[#222222] uppercase tracking-[0.5em]">Physical Assets</h4>
                   <div className="space-y-8">
                    <DetailItem label="Asset Model" value={selectedUser.vehicleModel} />
                    <div className="p-8 bg-black rounded-[48px] border border-white/5 shadow-inner">
                        <DetailItem label="Official Plate" value={selectedUser.registrationNumber} className="text-[#FFD500] font-black text-3xl tracking-tight" />
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <h4 className="text-[12px] font-black text-[#222222] uppercase tracking-[0.5em]">Encrypted Docs</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <DocLink label="License (Front)" url={selectedUser.licenseUrl} />
                    <DocLink label="License (Back)" url={selectedUser.licenseBackUrl} />
                    <DocLink label="National ID (CNIC)" url={selectedUser.cnicUrl} />
                  </div>
                </div>
              </div>

              <div className="flex gap-8 border-t border-white/5 pt-16">
                <Button variant="ghost" className="flex-1 !h-24 !rounded-[40px] border border-[#E4676720] !text-[#E46767] font-black uppercase tracking-[0.2em] text-sm hover:bg-[#E4676705]" onClick={() => { const r = prompt("Reason:"); if (r) handleUpdateStatus(selectedUser.uid, 'rejected', r); }} loading={actionLoading}>Reject</Button>
                <Button className="flex-1 !h-24 !rounded-[40px] !bg-[#22C55E] !text-black font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-green-500/20" onClick={() => handleUpdateStatus(selectedUser.uid, 'approved')} loading={actionLoading}>Approve Driver</Button>
              </div>
            </Card>
          ) : (
            <div className="h-[800px] flex flex-col items-center justify-center border-2 border-dashed border-[#111111] rounded-[100px] bg-[#050505]">
              <Lock className="w-16 h-16 text-[#0D0D0D] mb-8" />
              <p className="text-[#1A1A1A] font-black uppercase tracking-[0.8em] text-[14px]">System Idle • Waiting for Target</p>
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
      <p className={`text-xl font-medium text-white/80 ${className}`}>{value || 'NULL_DATA'}</p>
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
