import React, { useState } from 'react';
import { X, Check, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface RechargeBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRecharge: (credits: number, amountXOF: number, method: string) => void;
}

export const RechargeBottomSheet: React.FC<RechargeBottomSheetProps> = ({
  isOpen,
  onClose,
  onConfirmRecharge
}) => {
  const [selectedPack, setSelectedPack] = useState<'starter' | 'pro' | 'business'>('starter');
  const [selectedMethod, setSelectedMethod] = useState<'wave' | 'orange_money' | 'paydunya'>('wave');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const packs = [
    { id: 'starter' as const, name: 'Recharge Starter', credits: 6000, price: 15000 },
    { id: 'pro' as const, name: 'Recharge Pro (Populaire)', credits: 15000, price: 35000, popular: true },
    { id: 'business' as const, name: 'Recharge Illimitée', credits: 40000, price: 75000 }
  ];

  const handlePay = () => {
    setIsProcessing(true);
    const chosen = packs.find(p => p.id === selectedPack)!;

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onConfirmRecharge(chosen.credits, chosen.price, selectedMethod);
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md mx-auto bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 space-y-4 pb-safe animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar & Close */}
        <div className="flex items-center justify-between pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto" />
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center space-y-2 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-base font-extrabold text-white">Recharge Validée !</h3>
            <p className="text-xs text-slate-400">Vos crédits ont été ajoutés instantanément à votre solde.</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-sm font-extrabold text-white">Recharge de Crédits IA</h3>
              <p className="text-[11px] text-slate-400">Sélectionnez votre forfait et validez sur votre mobile</p>
            </div>

            {/* Pack Selector */}
            <div className="space-y-2">
              {packs.map((pack) => {
                const isSelected = selectedPack === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPack(pack.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition active:scale-[0.98] flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/30'
                        : 'bg-slate-800/60 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{pack.name}</span>
                        {pack.popular && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                            TOP
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold block mt-0.5">
                        +{pack.credits.toLocaleString()} Crédits
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-white font-mono">
                        {pack.price.toLocaleString()} F CFA
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Moyen de Paiement
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('wave')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    selectedMethod === 'wave'
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                      : 'bg-slate-800 border-white/5 text-slate-400'
                  }`}
                >
                  Wave
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('orange_money')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    selectedMethod === 'orange_money'
                      ? 'bg-orange-500/20 border-orange-400 text-orange-300'
                      : 'bg-slate-800 border-white/5 text-slate-400'
                  }`}
                >
                  Orange Money
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('paydunya')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    selectedMethod === 'paydunya'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-800 border-white/5 text-slate-400'
                  }`}
                >
                  PayDunya (CB)
                </button>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <span>Validation du paiement...</span>
              ) : (
                <>
                  <span>Payer et créditer instantanément</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
