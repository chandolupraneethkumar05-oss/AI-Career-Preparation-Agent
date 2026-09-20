import React from 'react';
import { Bot, Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#F8F6F0]">
      <div className="flex items-center justify-center">
        <div className="w-12 h-12 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex items-center justify-center shadow-xs">
          <Bot className="w-6 h-6 text-[#1B2A4A]" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#70685E]">
        <Loader2 className="w-3.5 h-3.5 text-[#1B2A4A] animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
