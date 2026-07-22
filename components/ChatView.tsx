'use client';

import { useChat } from 'ai/react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './ui/Card';
import Button from './ui/Button';

export default function ChatView() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <header className="p-4 border-b border-[#333333] flex items-center gap-3 sticky top-0 bg-black z-20">
        <div className="w-10 h-10 bg-[#FFD500] rounded-full flex items-center justify-center shadow-sm">
          <Bot className="text-black w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-[16px]">Travel Assistant</h2>
          <p className="text-[10px] text-[#22C55E] font-bold uppercase tracking-wider">AI Powered • RAG</p>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
            <div className="w-20 h-20 bg-[#212121] rounded-full flex items-center justify-center border border-[#333333]">
              <Sparkles className="w-10 h-10 text-[#FFD500]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-xl">How can I help you?</h3>
              <p className="text-sm text-[#ABABAB] leading-relaxed">
                Ask about safety protocols, PKR pricing, or plan your next trip across Pakistan.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
              {[
                "What is the SOS number?",
                "How is ride price calculated?",
                "Plan a trip to Hunza"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    const event = { target: { value: suggestion } } as any;
                    handleInputChange(event);
                  }}
                  className="bg-[#212121] border border-[#333333] p-3 rounded-xl text-xs text-center hover:border-[#FFD500] transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                radius="xl"
                className={`max-w-[85%] p-4 text-[14px] leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-[#FFD500] text-black font-medium !rounded-tr-none'
                    : 'bg-[#212121] text-white border border-[#333333] !rounded-tl-none'
                }`}
              >
                {m.content}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex justify-start">
            <Card radius="xl" className="bg-[#212121] p-4 !rounded-tl-none border border-[#333333] shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-[#FFD500] rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-[#FFD500] rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-[#FFD500] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black border-t border-[#333333]">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about travel safety..."
              className="w-full bg-[#212121] border border-[#333333] rounded-[24px] py-4 px-6 text-[14px] focus:outline-none focus:border-[#FFD500] focus:ring-1 focus:ring-[#FFD500] transition-all text-white placeholder:text-[#666666]"
            />
          </div>
          <Button
            type="submit"
            disabled={!input || isLoading}
            className="!w-14 !h-14 !rounded-full !p-0 shrink-0 shadow-lg"
          >
            <Send className="w-6 h-6" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-[#444444] mt-3 uppercase font-bold tracking-tighter">
          Travel Buddy AI Security Guard Active
        </p>
      </div>
    </div>
  );
}
