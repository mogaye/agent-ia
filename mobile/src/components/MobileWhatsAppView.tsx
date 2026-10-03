import React, { useState } from 'react';
import { 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone, 
  Zap, 
  Sliders, 
  Wifi, 
  WifiOff,
  History,
  MessageSquare
} from 'lucide-react';
import { MobileStats } from '../types';

interface MobileWhatsAppViewProps {
  stats: MobileStats;
  qrDataUrl: string | null;
  onRefreshQr: () => void;
  isRefreshingQr: boolean;
  onUpdateLatency: (seconds: number) => void;
}

export const MobileWhatsAppView: React.FC<MobileWhatsAppViewProps> = ({
  stats,
  qrDataUrl,
  onRefreshQr,
  isRefreshingQr,
  onUpdateLatency
}) => {
  const isConnected = stats.whatsappStatus === 'connected';
  const [latencyVal, setLatencyVal] = useState(stats.responseLatencySeconds || 10);

  return (
    <div className="space-y-4 pb-28 px-4 pt-3 animate-slide-up">
      {/* Title & Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Passerelle WhatsApp</h2>
          <p className="text-xs text-slate-400">Multi-Appareils Baileys temps réel</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 border ${
          isConnected
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          {isConnected ? 'Session Active' : 'En Attente de Scan'}
        </span>
      </div>

      {/* Main QR Box / Connection Status */}
      <div className="rounded-3xl p-5 bg-slate-900/80 border border-white/10 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
        {isConnected ? (
          <div className="py-6 flex flex-col items-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                WhatsApp Connecté
              </span>
              <p className="text-lg font-black text-white font-mono mt-0.5">
                {stats.connectedPhone || '+221 70 590 87 25'}
              </p>
            </div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Votre agent IA répond automatiquement et en continu à tous vos clients sur ce numéro.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={onRefreshQr}
                disabled={isRefreshingQr}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-white/5 active:scale-95 transition"
              >
                Changer de numéro / Réinitialiser
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center space-y-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">
              Scannez avec WhatsApp
            </span>

            {/* QR Container */}
            <div className="w-60 h-60 rounded-2xl bg-white p-2.5 shadow-2xl flex items-center justify-center relative">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="WhatsApp QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-700 space-y-2">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                  <span className="text-[11px] font-bold">Chargement du QR Code...</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-tight">
              Ouvrez WhatsApp sur votre téléphone &gt; <strong className="text-slate-200">Appareils connectés</strong> &gt; <strong className="text-slate-200">Connecter un appareil</strong>
            </p>

            <button
              onClick={onRefreshQr}
              disabled={isRefreshingQr}
              className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQr ? 'animate-spin' : ''}`} />
              <span>Régénérer QR Code</span>
            </button>
          </div>
        )}
      </div>

      {/* Latency & Human Typing Simulation Slider */}
      <div className="rounded-2xl p-4 bg-slate-900/60 border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white">Délai de Frappe Humaine</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            {latencyVal}s
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="30"
          value={latencyVal}
          onChange={(e) => {
            const v = Number(e.target.value);
            setLatencyVal(v);
            onUpdateLatency(v);
          }}
          className="w-full accent-emerald-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>1s (Instantané)</span>
          <span>10s (Naturel)</span>
          <span>30s (Réflexion)</span>
        </div>
      </div>

      {/* Instructions list for mobile */}
      <div className="rounded-2xl p-4 bg-slate-900/40 border border-white/5 space-y-2">
        <h4 className="text-xs font-bold text-slate-300">Règles de conformité & Opt-Out</h4>
        <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
          <li>Le mot-clé <span className="text-emerald-400 font-mono font-bold">STOP</span> désabonne automatiquement le contact.</li>
          <li>Le mot-clé <span className="text-emerald-400 font-mono font-bold">START</span> réactive les messages automatiques.</li>
          <li>Protection anti-spam intégrée : limitation à 2000 caractères par échange.</li>
        </ul>
      </div>
    </div>
  );
};
