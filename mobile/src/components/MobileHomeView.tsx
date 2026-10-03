import React from 'react';
import { 
  Zap, 
  MessageSquare, 
  Bot, 
  Wallet, 
  QrCode, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Flame,
  Download,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { MobileStats } from '../types';

interface MobileHomeViewProps {
  stats: MobileStats;
  onNavigate: (tab: any) => void;
  onOpenRecharge: () => void;
  onToggleAutopilot: () => void;
  onDownloadZip: () => void;
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  stats,
  onNavigate,
  onOpenRecharge,
  onToggleAutopilot,
  onDownloadZip
}) => {
  const percentUsed = Math.min(100, Math.round(((stats.monthlyLimit - stats.creditsRemaining) / stats.monthlyLimit) * 100)) || 25;
  const isConnected = stats.whatsappStatus === 'connected';

  return (
    <div className="space-y-4 pb-24 px-4 pt-3 animate-slide-up">
      {/* 1. Hero Card: Solde IA & Recharge Tactile */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-emerald-950/40 border border-emerald-500/20 shadow-xl mobile-emerald-glow">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-emerald-400 fill-current" />
            Portefeuille IA Actif
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
            Forfait Pro
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {stats.creditsRemaining.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Crédits restants ce mois
            </p>
          </div>
          <button
            onClick={onOpenRecharge}
            className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition flex items-center gap-1.5"
          >
            <span>Recharger</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${Math.max(5, 100 - percentUsed)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>{stats.messagesSentToday} messages envoyés ajd</span>
            <span>{(100 - percentUsed)}% disponible</span>
          </div>
        </div>
      </div>

      {/* 2. WhatsApp Status Banner / Quick Action */}
      <div 
        onClick={() => onNavigate('whatsapp')}
        className={`rounded-2xl p-4 border transition active:scale-[0.98] cursor-pointer flex items-center justify-between ${
          isConnected
            ? 'bg-slate-900/70 border-emerald-500/30'
            : 'bg-amber-950/30 border-amber-500/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
            isConnected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
          }`}>
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Passerelle WhatsApp</h3>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isConnected
                ? (stats.connectedPhone || 'Session connectée 24/7')
                : 'QR code prêt à être scanné'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-xs font-semibold text-emerald-400">
            {isConnected ? 'Gérer' : 'Scanner'}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 3. Autopilot Switch & Latency Widget */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3.5 bg-slate-900/60 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Pilote Auto IA</span>
            <button
              onClick={onToggleAutopilot}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                stats.autoPilotEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                stats.autoPilotEnabled ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>{stats.autoPilotEnabled ? 'Actif (Réponses 24/7)' : 'En Pause'}</span>
          </div>
        </div>

        <div className="rounded-2xl p-3.5 bg-slate-900/60 border border-white/5 space-y-2">
          <span className="text-xs text-slate-400 font-medium">Vitesse Réponse</span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>~{stats.responseLatencySeconds} secondes</span>
          </div>
          <p className="text-[10px] text-slate-400">Simulation frappe humaine</p>
        </div>
      </div>

      {/* 4. Quick Actions Grid */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Raccourcis Rapides
        </h4>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onNavigate('whatsapp')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/50 border border-white/5 text-center active:scale-95 transition"
          >
            <QrCode className="w-5 h-5 text-emerald-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-200">QR Code</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Scannable</span>
          </button>

          <button
            onClick={() => onNavigate('ai_agent')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/50 border border-white/5 text-center active:scale-95 transition"
          >
            <Sparkles className="w-5 h-5 text-teal-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-200">Tester IA</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Chat direct</span>
          </button>

          <button
            onClick={onOpenRecharge}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/50 border border-white/5 text-center active:scale-95 transition"
          >
            <Wallet className="w-5 h-5 text-amber-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-200">Recharger</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Wave / OM</span>
          </button>
        </div>
      </div>

      {/* 5. Download Mobile ZIP Banner */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/60 border border-emerald-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Archive Mobile (.ZIP)</h4>
            <p className="text-[10px] text-slate-400">Code autonome prêt pour APK & iOS</p>
          </div>
        </div>
        <button
          onClick={onDownloadZip}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 active:scale-95 transition shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>ZIP</span>
        </button>
      </div>
    </div>
  );
};
