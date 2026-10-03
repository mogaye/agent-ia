import React from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  CreditCard, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Download,
  Flame
} from 'lucide-react';
import { TransactionItem } from '../types';

interface MobileWalletViewProps {
  creditsRemaining: number;
  onOpenRecharge: () => void;
}

export const MobileWalletView: React.FC<MobileWalletViewProps> = ({
  creditsRemaining,
  onOpenRecharge
}) => {
  const transactions: TransactionItem[] = [];

  return (
    <div className="space-y-4 pb-28 px-4 pt-3 animate-slide-up">
      {/* Wallet Card */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-white">Solde IA Disponible</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Forfait Mensuel Actif
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {creditsRemaining.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Crédits de conversation WhatsApp
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
      </div>

      {/* Payment Methods supported in West Africa */}
      <div className="rounded-2xl p-4 bg-slate-900/60 border border-white/5 space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Moyens de Recharge Rapide (Sénégal & UEMOA)
        </h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/5 flex flex-col items-center">
            <span className="text-xs font-black text-sky-400">Wave</span>
            <span className="text-[9px] text-slate-400 mt-0.5">1% frais</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/5 flex flex-col items-center">
            <span className="text-xs font-black text-orange-400">Orange</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Money</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/5 flex flex-col items-center">
            <span className="text-xs font-black text-emerald-400">Free</span>
            <span className="text-[9px] text-slate-400 mt-0.5">Money</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/5 flex flex-col items-center">
            <span className="text-xs font-black text-indigo-400">CB / Visa</span>
            <span className="text-[9px] text-slate-400 mt-0.5">PayDunya</span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Historique des Recharges
        </h3>
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3 rounded-2xl bg-slate-900/50 border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>+{tx.credits.toLocaleString()} Crédits</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                      {tx.method}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{tx.date}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-200">
                  {tx.amountXOF.toLocaleString()} F CFA
                </span>
                <span className="block text-[9px] text-emerald-400 font-medium">Validé</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
