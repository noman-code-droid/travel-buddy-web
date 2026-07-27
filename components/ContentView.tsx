'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface ContentViewProps {
  onClose: () => void;
  title: string;
  content?: string;
  faqs?: FaqItem[];
}

export default function ContentView({ onClose, title, content, faqs }: ContentViewProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-black z-[90] flex flex-col"
    >
      {/* Header - Matches activity_content.xml headerLayout */}
      <div className="p-4 flex items-center justify-between border-b border-[#333333] bg-black sticky top-0 z-10">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center active:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="text-white w-7 h-7 rotate-180" />
        </button>
        <h2 className="text-[20px] font-bold text-white flex-1 text-center pr-10">{title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {content && (
          <div className="text-[15px] text-[#ABABAB] leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        )}

        {faqs && (
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-[#1A1A1A] rounded-[16px] overflow-hidden border border-white/[0.02]"
              >
                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left active:bg-white/5 transition-colors"
                >
                  <span className="text-[15px] font-bold text-white pr-4">{faq.question}</span>
                  {expandedIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-[#FFD500]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#666666]" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="px-5 pb-5 text-[14px] text-[#888888] leading-relaxed border-t border-white/[0.03] pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
