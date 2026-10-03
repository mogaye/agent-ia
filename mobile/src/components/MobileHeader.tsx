import React from 'react';
import { Smartphone, Zap, Bell, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { MobileStats } from '../types';

interface MobileHeaderProps {
  stats: MobileStats;
  onOpenRecharge: () => void;
  onOpenWhatsApp: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  stats,
  onOpenRecharge,
  onOpenWhatsApp
}) => {
  const isOnline = stats.whatsappStatus === 'connected';

  return (
    <header className="sticky top-0 z-40 bg-[#070E1A]/90 backdrop-blur-xl border-b border-white/5 pt-safe px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Brand & Mode */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#070E1A] ${
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold tracking-tight text-white">SMG Flow</h1>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Mobile
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[130px]">
              {stats.agentName || 'Agent WhatsApp IA'}
            </p>
          </div>
        </div>

        {/* Right actions: WhatsApp Status & Quick Balance */}
        <div className="flex items-center gap-2">
          {/* Quick WhatsApp Pill */}
          <button
            onClick={onOpenWhatsApp}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border transition active:scale-95 ${
              isOnline
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/30 text-amber-300'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="font-mono text-[10px]">Actif</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span className="font-mono text-[10px]">Scanner</span>
              </>
            )}
          </button>

          {/* Quick Credits Balance Chip */}
          <button
            onClick={onOpenRecharge}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-white flex items-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <span className="text-[10px] text-slate-400 uppercase font-mono">Crédits</span>
            <span className="text-xs font-extrabold text-emerald-300 font-mono">
              {stats.creditsRemaining.toLocaleString()}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
