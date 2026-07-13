import React from "react";
import { OrigamiCrowLogo } from "@/components/OrigamiCrowLogo";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

export function Header() {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-center mb-16 gap-6 border-b-2 border-orange-500 pb-6">
      <div className="flex items-center gap-4.5">
        <OrigamiCrowLogo size={60} />
        <div className="flex flex-col items-start">
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
            Quicks
          </h1>
          <span className="text-[10px] text-orange-400 font-mono tracking-wider uppercase font-bold">
            make expert subagents for any platform
          </span>
        </div>
      </div>
      <div className="text-right flex items-center gap-4">
        <span className="text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase">
          PASTE · DISTILL · DEPLOY
        </span>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-orange-500 text-black text-xs font-bold font-mono uppercase tracking-widest rounded-lg hover:bg-orange-400 transition-colors cursor-pointer">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  );
}
