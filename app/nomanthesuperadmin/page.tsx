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
  LogIn
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCredentialVerified, setIsCredentialVerified] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const router = useRouter();

  // 1. Secure Authentication Gate (Firebase + Firestore Check)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else {
          console.error("Access Denied: User is not an admin.");
          router.push('/');
        }
      } catch (err) {
        router.push('/');
      }
    });

    return () => unsubAuth();
  }, [router]);

  // 2. Real-time Data Sync
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
      setLoading(false);
    }, (error) => {
      console.error("Data fetch failed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, isCredentialVerified]);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const envUser = process.env.NEXT_PUBLIC_SUPER_ADMIN_USERNAME || 'nomanash123';
    const envPass = process.env.NEXT_PUBLIC_SUPER_ADMIN_PASSWORD || 'Admin123Noman@@';

    if (username === envUser && password === envPass) {
      setIsCredentialVerified(true);
      setLoginError('');
    } else {
      setLoginError('Invalid security credentials');
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
      alert(`System Update: User is now ${status.toUpperCase()}`);
    } catch (error) {
      alert("Database error: Could not update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteApplication = async (uid: string) => {
    if (!confirm("Are you sure? This will wipe the driver's documents and reset their application.")) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        isDriverApplied: false,
        verificationStatus: 'none',
        licenseUrl: null,
        licenseBackUrl: null,
        cnicUrl: null
      });
      setSelectedUser(null);
      alert("Application purged successfully.");
    } catch (error) {
      alert("Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // 1. Firebase Auth Loading State
  if (isAdmin === null) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-6">
      <div className="relative">
         <div className="w-16 h-16 border-4 border-[#FFD50020] border-t-[#FFD500] rounded-full animate-spin" />
         <Lock className="absolute inset-0 m-auto w-6 h-6 text-[#FFD500]" />
      </div>
      <div className="text-center">
        <p className="text-white font-black uppercase tracking-[0.2em] text-sm italic">Secure Portal</p>
        <p className="text-[#666666] text-[10px] uppercase font-bold tracking-widest mt-1">Verifying Authority...</p>
      </div>
    </div>
  );

  // 2. Extra Credential Layer
  if (!isCredentialVerified) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center p-6">
      <Card variant="flat" radius="3xl" className="w-full max-w-[400px] p-10 border-white/5 shadow-2xl bg-[#0A0A0A]">
        <div className="flex flex-col items-center text-center space-y-6 mb-8">
           <div className="p-4 bg-[#FFD500] rounded-3xl shadow-[0_0_30px_rgba(255,213,0,0.15)] text-black">
              <ShieldAlert className="w-10 h-10" />
           </div>
           <div className="space-y-1">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">Security Check</h2>
              <p className="text-[#666666] text-[10px] font-bold uppercase tracking-widest">Identify yourself to continue</p>
           </div>
        </div>

        <form onSubmit={handleManualLogin} className="space-y-4">
          <Input
            label="Admin Username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="Security Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {loginError && <p className="text-[#E46767] text-[10px] font-black uppercase text-center">{loginError}</p>}
          <Button type="submit" className="w-full !h-16 !rounded-[20px] mt-4 font-black uppercase tracking-widest text-xs">
             <LogIn className="w-4 h-4 mr-2" /> Access Database
          </Button>
        </form>

        <Link href="/" className="mt-8 block text-center text-[10px] font-black text-[#444444] uppercase tracking-widest hover:text-[#FFD500] transition-colors">
          Return to Application
        </Link>
      </Card>
    </div>
  );

  // 3. Final Loading State for Data
  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#FFD500] animate-spin" />
      <p className="text-[#666666] font-bold uppercase tracking-widest text-[10px] mt-4">Syncing Global Records</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-[#444444] hover:text-[#FFD500] transition-colors text-[10px] font-black uppercase tracking-widest group">
             <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> Exit to App
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-[#FFD500] rounded-3xl shadow-[0_0_40px_rgba(255,213,0,0.1)] text-black">
               <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
               <h1 className="text-4xl font-black tracking-tighter italic uppercase">Admin Console</h1>
               <p className="text-[#666666] text-xs font-bold uppercase tracking-[0.3em] mt-1">Global Verification Authority</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
           <Card variant="flat" className="px-8 py-5 flex flex-col justify-center border-white/5 bg-black/40 backdrop-blur-xl">
              <span className="text-[10px] font-black text-[#444444] uppercase mb-1 tracking-widest">Applications</span>
              <span className="text-3xl font-black text-[#FFD500]">{users.length}</span>
           </Card>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] font-black text-[#333333] uppercase tracking-[0.4em] mb-6 ml-1">Live Applications</h2>
          {users.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-[#111111] rounded-[48px] bg-black/20">
              <CheckCircle className="w-12 h-12 text-[#22C55E] mx-auto mb-4 opacity-10" />
              <p className="text-[#222222] text-[10px] font-black uppercase tracking-widest">No Applications in Queue</p>
            </div>
          ) : (
            users.map(u => (
              <button key={u.uid} onClick={() => setSelectedUser(u)} className="w-full text-left transition-all hover:translate-x-2 active:scale-95 group">
                <Card variant={selectedUser?.uid === u.uid ? 'active' : 'flat'} className="p-6 flex items-center justify-between border-white/5 bg-[#080808]">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center shrink-0 font-black ${u.verificationStatus === 'approved' ? 'bg-[#22C55E10] text-[#22C55E]' : 'bg-[#111111] text-[#FFD500]'}`}>
                      {u.name?.[0] || 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-sm truncate text-white/90 group-hover:text-white">{u.name}</p>
                      <p className={`text-[10px] font-black uppercase mt-0.5 tracking-tighter ${u.verificationStatus === 'approved' ? 'text-[#22C55E]' : 'text-[#FFD500]'}`}>
                        {u.verificationStatus}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${selectedUser?.uid === u.uid ? 'text-[#FFD500] translate-x-1' : 'text-[#1a1a1a]'}`} />
                </Card>
              </button>
            ))
          )}
        </div>

        {/* Right Details */}
        <div className="lg:col-span-8">
          {selectedUser ? (
            <Card variant="flat" radius="3xl" className="p-12 sticky top-12 border-white/5 shadow-2xl bg-[#080808]">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16 relative">
                <div className="flex gap-8">
                  <div className="w-32 h-32 bg-[#111111] rounded-[48px] flex items-center justify-center overflow-hidden border-4 border-black shadow-2xl shrink-0">
                    {selectedUser.photoUrl ? (
                        <img src={selectedUser.photoUrl} alt="P" className="w-full h-full object-cover" />
                    ) : (
                        <User className="text-black w-14 h-14" />
                    )}
                  </div>
                  <div className="pt-4">
                    <h3 className="text-5xl font-black tracking-tighter uppercase italic">{selectedUser.name}</h3>
                    <p className="text-[#FFD500] font-black text-xl tracking-tight">{selectedUser.phone}</p>
                    <div className="flex gap-3 mt-6">
                       <span className="bg-[#22C55E15] text-[#22C55E] text-[10px] font-black px-4 py-1.5 rounded-full border border-[#22C55E30] uppercase">Verified ID</span>
                       <span className="bg-white/5 text-white/40 text-[10px] font-black px-4 py-1.5 rounded-full border border-white/5 font-mono uppercase italic">Ref: {selectedUser.uid.substring(0, 10)}</span>
                    </div>
                  </div>
                </div>
                <button
                    onClick={() => handleDeleteApplication(selectedUser.uid)}
                    className="p-4 bg-[#E4676708] rounded-[24px] text-[#E46767] hover:bg-[#E4676720] transition-all active:scale-90 border border-[#E4676710]"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
                <div className="space-y-8">
                   <h4 className="text-[11px] font-black text-[#333333] uppercase tracking-[0.4em]">Vehicle Assets</h4>
                   <div className="grid grid-cols-1 gap-6">
                    <DetailItem label="Model" value={selectedUser.vehicleModel} />
                    <div className="p-6 bg-black rounded-[32px] border border-white/5 shadow-inner">
                        <DetailItem label="License Plate" value={selectedUser.registrationNumber} className="text-[#FFD500] font-black text-2xl tracking-tighter" />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[11px] font-black text-[#333333] uppercase tracking-[0.4em]">Document Vault</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <DocLink label="Driver License (Front)" url={selectedUser.licenseUrl} />
                    <DocLink label="Driver License (Back)" url={selectedUser.licenseBackUrl} />
                    <DocLink label="National ID Card (CNIC)" url={selectedUser.cnicUrl} />
                  </div>
                </div>
              </div>

              <div className="flex gap-6 border-t border-white/5 pt-12">
                <Button
                    variant="ghost"
                    className="flex-1 !h-20 !rounded-[32px] border border-[#E4676720] !text-[#E46767] font-black uppercase tracking-[0.2em] text-xs"
                    onClick={() => { const r = prompt("Enter reason for rejection:"); if (r) handleUpdateStatus(selectedUser.uid, 'rejected', r); }}
                    loading={actionLoading}
                >
                    <XCircle className="w-5 h-5 mr-3" /> Flag & Reject
                </Button>
                <Button
                    className="flex-1 !h-20 !rounded-[32px] !bg-[#22C55E] !text-black font-black uppercase tracking-[0.2em] text-xs shadow-lg"
                    onClick={() => handleUpdateStatus(selectedUser.uid, 'approved')}
                    loading={actionLoading}
                >
                    Confirm & Approve
                </Button>
              </div>
            </Card>
          ) : (
            <div className="h-[700px] flex flex-col items-center justify-center border-2 border-dashed border-[#111111] rounded-[80px] bg-[#050505]">
              <div className="w-24 h-24 bg-[#080808] rounded-full flex items-center justify-center border border-white/5 mb-8 shadow-inner">
                  <Lock className="w-10 h-10 text-[#1a1a1a]" />
              </div>
              <p className="text-[#222222] font-black uppercase tracking-[0.6em] text-[12px] italic">Awaiting Inspection</p>
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
      <p className="text-[10px] text-[#444444] font-black uppercase mb-1 tracking-widest">{label}</p>
      <p className={`text-lg font-medium text-white/80 ${className}`}>{value || 'DATA_MISSING'}</p>
    </div>
  );
}

function DocLink({ label, url }: { label: string, url?: string }) {
  return (
    <a href={url || '#'} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-6 rounded-[32px] border transition-all ${url ? 'bg-[#0A0A0A] border-white/5 hover:border-[#FFD500] hover:bg-black text-white' : 'bg-transparent border-white/5 text-[#222222] pointer-events-none'}`}>
      <div className="flex items-center gap-4">
        <FileText className="w-5 h-5 text-[#FFD500]" />
        <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
      </div>
      {url && <ExternalLink className="w-4 h-4 text-[#FFD500]" />}
    </a>
  );
}
