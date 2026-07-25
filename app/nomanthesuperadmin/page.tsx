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
  deleteDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
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
  Trash2
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionActionLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const user = auth.currentUser;
      if (!user) { router.push('/'); return; }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().isAdmin === true) {
          setIsAdmin(true);
        } else { router.push('/'); }
      } catch (err) { router.push('/'); }
    };
    checkAdminStatus();
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "users"), where("isDriverApplied", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

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
    } catch (error) { alert("Action failed."); }
    finally { setActionLoading(false); }
  };

  const handleDeleteApplication = async (uid: string) => {
    if (!confirm("Are you sure? This will remove the verification record completely.")) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        isDriverApplied: false,
        verificationStatus: 'none',
        licenseUrl: null,
        cnicUrl: null
      });
      setSelectedUser(null);
      alert("Application deleted (CRUD: Delete)");
    } catch (error) { alert("Delete failed."); }
    finally { setActionLoading(false); }
  };

  if (isAdmin === null || loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#FFD500] animate-spin" />
      <p className="text-[#666666] font-bold uppercase tracking-widest text-[10px] mt-4">Security Check Active</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 border-b border-white/5 pb-8">
        <div className="space-y-1">
          <Link href="/" className="flex items-center gap-2 text-[#666666] hover:text-white transition-colors mb-4 text-xs font-bold uppercase">
             <ArrowLeft className="w-3 h-3" /> Back to App
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD500] rounded-2xl shadow-[0_0_20px_rgba(255,213,0,0.2)]">
               <ShieldCheck className="text-black w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic">ADMIN OPS</h1>
          </div>
        </div>

        <div className="flex gap-4">
           <Card variant="flat" className="px-6 py-4 flex flex-col justify-center border-white/5 bg-[#111111]">
              <span className="text-[10px] font-black text-[#444444] uppercase mb-1">Queue Status</span>
              <span className="text-xl font-black text-[#FFD500]">{users.length} Pending</span>
           </Card>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-[10px] font-black text-[#333333] uppercase tracking-widest ml-1 mb-4">Application Stream</h2>
          {users.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#222222] rounded-[40px]">
              <CheckCircle className="w-10 h-10 text-[#22C55E] mx-auto mb-4 opacity-20" />
              <p className="text-[#333333] text-[10px] font-black uppercase">Database Clear</p>
            </div>
          ) : (
            users.map(user => (
              <button key={user.uid} onClick={() => setSelectedUser(user)} className="w-full text-left transition-all hover:translate-x-1 active:scale-95">
                <Card variant={selectedUser?.uid === user.uid ? 'active' : 'flat'} className="p-5 flex items-center gap-4 border-white/5 bg-[#0A0A0A]">
                  <div className="w-11 h-11 bg-[#111111] rounded-2xl border border-white/10 flex items-center justify-center shrink-0 font-black text-[#FFD500]">
                    {user.name?.[0] || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate text-white/90">{user.name}</p>
                    <p className={`text-[9px] font-black uppercase ${user.verificationStatus === 'approved' ? 'text-[#22C55E]' : 'text-[#FFD500]'}`}>
                      {user.verificationStatus}
                    </p>
                  </div>
                </Card>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-8">
          {selectedUser ? (
            <Card variant="flat" radius="3xl" className="p-10 sticky top-10 border-white/5 shadow-2xl bg-[#0A0A0A]">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                <div className="flex gap-6">
                  <div className="w-28 h-28 bg-[#FFD500] rounded-[40px] flex items-center justify-center overflow-hidden border-4 border-black shadow-2xl shrink-0">
                    {selectedUser.photoUrl ? <img src={selectedUser.photoUrl} alt="P" className="w-full h-full object-cover" /> : <User className="text-black w-12 h-12" />}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-4xl font-black tracking-tighter uppercase mb-1">{selectedUser.name}</h3>
                    <p className="text-[#FFD500] font-black text-lg">{selectedUser.phone}</p>
                    <div className="flex gap-2 mt-4">
                       <span className="bg-[#22C55E15] text-[#22C55E] text-[10px] font-black px-3 py-1 rounded-full border border-[#22C55E30]">ID VERIFIED</span>
                       <span className="bg-white/5 text-white/40 text-[10px] font-black px-3 py-1 rounded-full border border-white/5">WEB APPLICATION</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDeleteApplication(selectedUser.uid)} className="p-3 bg-white/5 rounded-2xl text-[#E46767] hover:bg-[#E4676720] transition-colors">
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-[#333333] uppercase tracking-[0.3em]">Vehicle Data Assets</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <DetailItem label="Manufacturer" value={selectedUser.vehicleMake} />
                    <DetailItem label="Model / Year" value={selectedUser.vehicleModel} />
                    <div className="p-4 bg-[#111111] rounded-2xl border border-white/5">
                        <DetailItem label="License Plate" value={selectedUser.registrationNumber} className="text-[#FFD500] font-black text-lg" />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-[#333333] uppercase tracking-[0.3em]">Document Vault</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <DocLink label="Driver License" url={selectedUser.licenseUrl} />
                    <DocLink label="License Back" url={selectedUser.licenseBackUrl} />
                    <DocLink label="Identity Card (CNIC)" url={selectedUser.cnicUrl} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-10">
                <Button
                    variant="destructive"
                    className="flex-1 !h-16 !rounded-[24px] border border-[#E4676730] !text-white font-black uppercase tracking-widest text-xs"
                    onClick={() => { const r = prompt("Reason for rejection:"); if (r) handleUpdateStatus(selectedUser.uid, 'rejected', r); }}
                    loading={actionLoading}
                >
                    Reject Application
                </Button>
                <Button
                    className="flex-1 !h-16 !rounded-[24px] !bg-[#22C55E] !text-black font-black uppercase tracking-widest text-xs"
                    onClick={() => handleUpdateStatus(selectedUser.uid, 'approved')}
                    loading={actionLoading}
                >
                    Approve Driver
                </Button>
              </div>
            </Card>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-[#111111] rounded-[60px] bg-[#080808]">
              <Lock className="w-12 h-12 text-[#111111] mb-4" />
              <p className="text-[#222222] font-black uppercase tracking-[0.4em] text-[10px]">Awaiting Inspection</p>
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
      <p className="text-[9px] text-[#444444] font-black uppercase mb-1">{label}</p>
      <p className={`text-sm font-medium text-white/80 ${className}`}>{value || '---'}</p>
    </div>
  );
}

function DocLink({ label, url }: { label: string, url?: string }) {
  return (
    <a href={url || '#'} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${url ? 'bg-[#111111] border-white/5 hover:border-[#FFD500] text-white/80' : 'bg-transparent border-white/5 text-[#222222] pointer-events-none'}`}>
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-[#FFD500]" />
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      {url && <ExternalLink className="w-3 h-3 text-[#FFD500]" />}
    </a>
  );
}
