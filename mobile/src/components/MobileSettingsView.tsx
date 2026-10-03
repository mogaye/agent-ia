import React, { useState } from 'react';
import { 
  Settings, 
  Download, 
  Smartphone, 
  ShieldCheck, 
  Code, 
  Check, 
  ExternalLink,
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { MobileStats } from '../types';

interface MobileSettingsViewProps {
  stats: MobileStats;
  onDownloadZip: () => void;
}

export const MobileSettingsView: React.FC<MobileSettingsViewProps> = ({
  stats,
  onDownloadZip
}) => {
  const [copied, setCopied] = useState(false);

  const copyCapacitorCommand = () => {
    navigator.clipboard.writeText('npm install && npx cap sync && npx cap open android');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-28 px-4 pt-3 animate-slide-up">
      {/* Title */}
      <div>
        <h2 className="text-base font-extrabold text-white">Paramètres Mobiles</h2>
        <p className="text-xs text-slate-400">Configuration de l'application & export natif</p>
      </div>

      {/* 1. Download Mobile ZIP Archive */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Télécharger le code Mobile (.ZIP)</h3>
            <p className="text-[11px] text-emerald-300/80">Projet mobile complet et indépendant</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Cette archive contient l'application mobile autonome optimisée pour smartphone, compatible avec <strong>Capacitor (Android Studio & Xcode)</strong> et installable en <strong>PWA</strong>.
        </p>

        <button
          onClick={onDownloadZip}
          className="w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Télécharger smgflow-mobile.zip</span>
        </button>
      </div>

      {/* 2. Build Android APK Instructions */}
      <div className="rounded-2xl p-4 bg-slate-900/60 border border-white/5 space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white">Générer un APK Android (Capacitor)</h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Une fois l'archive décompressée sur votre ordinateur, lancez la commande suivante dans le terminal pour ouvrir le projet dans Android Studio :
        </p>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 font-mono text-[10px] text-emerald-400 flex items-center justify-between">
          <code className="truncate mr-2">npm i && npx cap sync && npx cap open android</code>
          <button
            onClick={copyCapacitorCommand}
            className="text-slate-400 hover:text-white shrink-0 p-1"
            title="Copier"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Layers className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3. PWA Installation tips */}
      <div className="rounded-2xl p-4 bg-slate-900/60 border border-white/5 space-y-2">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Installation sur Smartphone sans Store</span>
        </h3>
        <div className="text-[11px] text-slate-400 space-y-1">
          <p>• <strong>Sur iPhone (Safari) :</strong> Appuyez sur Partager puis « Sur l'écran d'accueil ».</p>
          <p>• <strong>Sur Android (Chrome) :</strong> Appuyez sur les 3 points verticaux puis « Installer l'application ».</p>
        </div>
      </div>
    </div>
  );
};
