import React, { useState } from 'react';
import { MobileApp } from '../../mobile/src/App';
import { 
  Smartphone, 
  Download, 
  X, 
  RotateCw, 
  Maximize2, 
  Check, 
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';

interface MobileDeviceSimulatorProps {
  onClose: () => void;
}

export const MobileDeviceSimulator: React.FC<MobileDeviceSimulatorProps> = ({ onClose }) => {
  const [deviceType, setDeviceType] = useState<'iphone' | 'fullscreen'>('iphone');
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownload = () => {
    setIsDownloaded(true);
    window.location.href = '/api/download/mobile-zip';
    setTimeout(() => setIsDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden animate-fadeIn">
      {/* Top Simulator Control Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between py-2 px-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg text-white text-xs mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm flex items-center gap-2">
              <span>Mode Mobile Adapté</span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                smgflow-mobile.zip
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Modèle optimisé pour smartphone (tactile, barre basse, recharge Wave/OM, PWA & Capacitor)
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Switch View Mode */}
          <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-xl border border-white/5">
            <button
              onClick={() => setDeviceType('iphone')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                deviceType === 'iphone' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Châssis Mobile
            </button>
            <button
              onClick={() => setDeviceType('fullscreen')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                deviceType === 'fullscreen' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Plein Écran
            </button>
          </div>

          {/* Download ZIP button */}
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
          >
            {isDownloaded ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isDownloaded ? 'Téléchargé !' : 'Télécharger ZIP'}</span>
          </button>

          {/* Close / Return to Desktop */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Quitter le simulateur mobile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Device Frame or Fullscreen Canvas */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
        {deviceType === 'iphone' ? (
          <div className="relative w-[375px] h-[780px] max-h-[85vh] rounded-[48px] bg-slate-900 p-3 shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)] border-4 border-slate-700/80 ring-1 ring-white/10 flex flex-col">
            {/* Dynamic Island / Speaker */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/80 mr-2 animate-pulse" />
              <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800" />
            </div>

            {/* Mobile Screen Surface */}
            <div className="w-full h-full rounded-[38px] overflow-hidden bg-[#070E1A] relative flex flex-col">
              <MobileApp />
            </div>

            {/* Home Indicator bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-slate-600/70 pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full max-w-md rounded-3xl overflow-hidden bg-[#070E1A] border border-white/10 shadow-2xl relative flex flex-col">
            <MobileApp />
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="text-center pt-2">
        <span className="text-[11px] text-slate-400 font-medium">
          Dossier source : <code className="font-mono text-emerald-400">/mobile</code> • Archive : <code className="font-mono text-emerald-400">smgflow-mobile.zip</code>
        </span>
      </div>
    </div>
  );
};
