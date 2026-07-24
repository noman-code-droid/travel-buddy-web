'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Users, Loader2 } from 'lucide-react';
import Card from './ui/Card';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  limit
} from 'firebase/firestore';

interface GlobalChatViewProps {
  onClose: () => void;
}

export default function GlobalChatView({ onClose }: GlobalChatViewProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const globalChatId = "temp_global_group_chat";

  useEffect(() => {
    const q = query(
      collection(db, "global_chats", globalChatId, "messages"),
      orderBy("timestamp", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !auth.currentUser) return;

    const text = input.trim();
    setInput('');

    try {
      await addDoc(collection(db, "global_chats", globalChatId, "messages"), {
        text,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'User',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending global message:", error);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[85] flex flex-col"
    >
      <header className="p-4 border-b border-[#333333] flex items-center gap-3 bg-black sticky top-0 z-10">
        <button onClick={onClose}><ArrowLeft className="text-white w-7 h-7" /></button>
        <div className="w-10 h-10 bg-[#FFD500] rounded-full flex items-center justify-center">
          <Users className="text-black w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-white">Global Community</h2>
          <p className="text-[10px] text-[#22C55E] uppercase font-bold">Public Chat</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#FFD500] w-6 h-6" />
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] flex flex-col">
                {m.senderId !== auth.currentUser?.uid && (
                  <span className="text-[10px] text-[#666666] ml-2 mb-1 font-bold">{m.senderName}</span>
                )}
                <Card
                  radius="xl"
                  className={`p-3 text-sm ${
                    m.senderId === auth.currentUser?.uid
                      ? 'bg-[#FFD500] text-black font-medium !rounded-tr-none'
                      : 'bg-[#212121] text-white border border-[#333333] !rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  <p className={`text-[9px] mt-1 text-right ${m.senderId === auth.currentUser?.uid ? 'text-black/60' : 'text-[#666666]'}`}>
                    {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </Card>
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="p-4 bg-black border-t border-[#333333]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Post to community..."
            className="flex-1 bg-[#212121] border border-[#333333] rounded-[24px] py-4 px-6 text-sm focus:outline-none focus:border-[#FFD500] text-white placeholder:text-[#666666]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-12 h-12 bg-[#FFD500] rounded-full flex items-center justify-center active:scale-90 transition-all shadow-lg"
          >
            <Send className="text-black w-5 h-5" />
          </button>
        </form>
      </footer>
    </motion.div>
  );
}
