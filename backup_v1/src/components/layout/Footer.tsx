import React from "react";
import { OrigamiCrowLogo } from '@/components/OrigamiCrowLogo';

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 mt-24 text-center text-xs text-gray-500 font-mono relative z-10 flex flex-col items-center justify-center gap-2">
      <OrigamiCrowLogo size={20} className="opacity-30" />
      <p>© 2026 Quicks • Make expert subagents for any platform</p>
    </footer>
  );
}
