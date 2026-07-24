'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Chat } from '@/types';

interface ChatListViewProps {
  onClose: () => void;
  chats: Chat[];
  onChatClick: (chat: Chat) => void;
}

export default function ChatListView({ onClose, chats, onChatClick }: ChatListViewProps) {
  // Use real data if provided, otherwise fallback to local list for safety
  const displayChats = chats.length > 0 ? chats : [
    { id: '1', name: 'Ahmed Khan', otherUserId: 'driver1', lastMsg: 'I am near the gate, please be ready.', time: '10:45 AM', unread: 1 },
    { id: '2', name: 'Sara Malik', otherUserId: 'driver2', lastMsg: 'Okay, see you then.', time: 'Yesterday', unread: 0 },
  ];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[60] flex flex-col"
    >
      <div className="p-4 flex items-center gap-4">
        <button onClick={onClose}><ArrowLeft className="text-white w-7 h-7" /></button>
        <h2 className="font-bold text-[20px]">Messages</h2>
      </div>
      <div className="p-2 space-y-1 overflow-y-auto">
        {displayChats.map((chat, i) => (
          <button
            key={chat.id || i}
            onClick={() => onChatClick(chat)}
            className="w-full bg-[#212121] p-4 flex gap-4 items-center active:bg-[#333333] transition-colors border-b border-[#333333]"
          >
             <div className="w-14 h-14 bg-[#FFD500] rounded-full flex items-center justify-center font-bold text-black text-[20px]">
                {chat.name[0]}
             </div>
             <div className="flex-1 text-left">
                <div className="flex justify-between items-center mb-1">
                   <h4 className="font-bold text-[16px] text-white">{chat.name}</h4>
                   <span className="text-[11px] text-[#666666]">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                   <p className="text-[13px] text-[#ABABAB] truncate w-48">{chat.lastMsg}</p>
                   {chat.unread > 0 && <span className="bg-[#FFD500] text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{chat.unread}</span>}
                </div>
             </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
