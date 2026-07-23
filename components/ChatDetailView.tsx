'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MoreVertical, Loader2, User } from 'lucide-react';
import { Chat, Message } from '@/types';
import Card from './ui/Card';
import Button from './ui/Button';
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
}

export default function ChatDetailView({ onClose, chat }: ChatDetailViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chat || !auth.currentUser) return;

    // Mark as read (Matches markChatAsRead in ChatDetailActivity.kt)
    const chatRef = doc(db, "chats", chat.id);
    updateDoc(chatRef, {
      [`unreadCount_${auth.currentUser.uid}`]: 0
    });

    // Real-time Messages (Matches setupRealTimeChat)
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

    // Typing indicator (Matches setupTypingIndicator)
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

      // Add message
      await addDoc(collection(db, "chats", chat.id, "messages"), {
        text,
        senderId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        type: 'TEXT'
      });

      // Update chat summary
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

    // Update typing status
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
      {/* Header */}
      <header className="p-4 border-b border-[#333333] flex items-center justify-between bg-black sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose}><ArrowLeft className="text-white w-7 h-7" /></button>
          <div className="w-10 h-10 bg-[#FFD500] rounded-full flex items-center justify-center font-bold text-black">
            {chat.name[0]}
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">{chat.name}</h2>
            <p className={`text-[10px] ${isTyping ? 'text-[#FFD500] animate-pulse font-bold' : 'text-[#22C55E]'}`}>
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <button className="p-2 active:bg-white/10 rounded-full transition-colors">
          <MoreVertical className="text-[#ABABAB] w-5 h-5" />
        </button>
      </header>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-[#FFD500] w-6 h-6" />
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                <Card
                  radius="xl"
                  className={`max-w-[80%] p-3 text-sm ${
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
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <Card radius="xl" className="bg-[#212121] p-3 !rounded-tl-none border border-[#333333]">
                  <div className="flex gap-1.5 px-1">
                    <span className="w-1.5 h-1.5 bg-[#FFD500] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#FFD500] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#FFD500] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <footer className="p-4 bg-black border-t border-[#333333]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 bg-[#212121] border border-[#333333] rounded-[24px] py-4 px-6 text-sm focus:outline-none focus:border-[#FFD500] text-white placeholder:text-[#666666]"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-12 h-12 bg-[#FFD500] rounded-full flex items-center justify-center disabled:opacity-50 active:scale-90 transition-all"
          >
            <Send className="text-black w-5 h-5" />
          </button>
        </form>
      </footer>
    </motion.div>
  );
}
