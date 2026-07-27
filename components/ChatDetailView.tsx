'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MoreVertical, Loader2, User } from 'lucide-react';
import { Chat, Message } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';
import ChatMenu from './ui/ChatMenu';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  setDoc
} from 'firebase/firestore';

interface ChatDetailViewProps {
  onClose: () => void;
  chat: Chat | null;
  onExitChat: () => void;
}

export default function ChatDetailView({ onClose, chat, onExitChat }: ChatDetailViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chat || !auth.currentUser) return;

    const chatRef = doc(db, "chats", chat.id);
    updateDoc(chatRef, {
      [`unreadCount_${auth.currentUser.uid}`]: 0
    });

    const q = query(
      collection(db, "chats", chat.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(list);
      setLoading(false);
    });

    const unsubTyping = onSnapshot(chatRef, (snapshot) => {
      const data = snapshot.data();
      setIsTyping(data?.[`typing_${chat.otherUserId}`] || false);
    });

    return () => {
      unsubscribe();
      unsubTyping();
    };
  }, [chat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chat || !auth.currentUser) return;

    const text = input.trim();
    setInput('');

    try {
      const chatRef = doc(db, "chats", chat.id);

      await addDoc(collection(db, "chats", chat.id, "messages"), {
        text,
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        type: 'TEXT'
      });

      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        [`unreadCount_${chat.otherUserId}`]: increment(1),
        [`typing_${auth.currentUser.uid}`]: false
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!chat || !auth.currentUser) return;

    const chatRef = doc(db, "chats", chat.id);
    updateDoc(chatRef, {
      [`typing_${auth.currentUser.uid}`]: e.target.value.length > 0
    });
  };

  if (!chat) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[80] flex flex-col"
    >
      <header className="p-3 border-b border-[#333333] flex items-center justify-between bg-black sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center active:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="text-white w-7 h-7 rotate-180" />
          </button>

          <div className="w-10 h-10 bg-[#FFD500] rounded-full flex items-center justify-center overflow-hidden border border-black/10 shrink-0">
            {chat.photoUrl ? (
              <img src={chat.photoUrl} alt={chat.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-black font-black text-lg uppercase">{chat.name[0]}</span>
            )}
          </div>

          <div className="ml-1">
            <h2 className="font-bold text-[15px] text-white leading-tight">{chat.name}</h2>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isTyping ? 'text-[#FFD500] animate-pulse' : 'text-[#22C55E]'}`}>
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowMenu(true)}
          className="w-10 h-10 flex items-center justify-center text-[#666666] active:text-white transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        <ChatMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          onClearChat={() => {}}
          onExitChat={onExitChat}
        />
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#FFD500] w-6 h-6" />
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3.5 rounded-[20px] shadow-sm ${
                    m.senderId === auth.currentUser?.uid
                      ? 'bg-[#FFD500] text-black font-medium rounded-tr-none'
                      : 'bg-[#1A1A1A] text-white border border-white/[0.05] rounded-tl-none'
                  }`}
                >
                  <p className="text-[14px] leading-relaxed">{m.text}</p>
                  <p className={`text-[9px] mt-1.5 text-right font-bold uppercase tracking-widest ${m.senderId === auth.currentUser?.uid ? 'text-black/40' : 'text-[#444444]'}`}>
                    {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#1A1A1A] p-3.5 rounded-[20px] rounded-tl-none border border-white/[0.05] shadow-sm">
                  <div className="flex gap-1.5 px-1">
                    <span className="w-1.5 h-1.5 bg-[#FFD500] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#FFD500] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#FFD500] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="p-4 bg-black border-t border-[#333333]">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <div className="flex-1 bg-[#1A1A1A] border border-[#222222] rounded-[28px] px-5 py-3.5 focus-within:border-[#FFD500] transition-all">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="bg-transparent outline-none text-[15px] w-full text-white placeholder:text-[#444444] font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-12 h-12 bg-[#FFD500] rounded-full flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all shadow-lg"
          >
            <Send className="text-black w-5 h-5 ml-0.5" />
          </button>
        </form>
      </footer>
    </motion.div>
  );
}
