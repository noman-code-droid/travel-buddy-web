'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Search, User } from 'lucide-react';
import { Chat } from '@/types';

interface ChatListViewProps {
  onClose: () => void;
  chats: Chat[];
  onChatClick: (chat: Chat) => void;
}

export default function ChatListView({ onClose, chats, onChatClick }: ChatListViewProps) {
  // Fallback data
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
      {/* Header - Matches activity_chat_list.xml */}
      <div className="p-4 flex items-center justify-between border-b border-[#333333] bg-black sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center active:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="text-white w-7 h-7 rotate-180" />
          </button>
          <h2 className="text-[20px] font-bold text-white tracking-tight">Chats</h2>
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-white active:bg-white/5 rounded-full transition-colors">
          <Search className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
            <div className="w-20 h-20 bg-[#333333] rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
          </div>
        ) : (
          displayChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatClick(chat)}
              className="w-full text-left active:scale-[0.98] transition-transform"
            >
              {/* Card - Matches item_chat_list.xml */}
              <div className="bg-[#212121] rounded-[16px] p-4 flex gap-4 items-center border border-white/[0.02]">
                <div className="w-12 h-12 bg-[#FFD500] rounded-full flex items-center justify-center overflow-hidden border border-black/10 shrink-0">
                  {chat.photoUrl ? (
                    <img src={chat.photoUrl} alt={chat.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-black font-black text-lg uppercase">{chat.name[0]}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-bold text-[15px] text-white truncate pr-2">{chat.name}</h4>
                    <span className="text-[11px] text-[#666666] font-medium shrink-0">{chat.time}</span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <p className="text-[13px] text-[#ABABAB] truncate font-medium flex-1 leading-tight">
                      {chat.lastMsg}
                    </p>
                    {chat.unread > 0 && (
                      <span className="bg-[#FFD500] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black shrink-0">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}
