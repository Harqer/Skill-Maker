import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ParticlesBackground } from '@/components/ParticlesBackground';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-orange-500/25 selection:text-orange-400 overflow-x-hidden relative">
      {/* Slow Drifting Particles Background with elegant gradient */}
      <ParticlesBackground />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/10 via-[#050505] to-[#050505] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Main Container */}
      <main className="relative max-w-3xl mx-auto px-6 py-12 z-10">
        <Header />
        
        {/* Child Routes */}
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
