import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Lock,
  Sparkles,
  Smartphone,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { 
  WaveIcon, 
  OrangeMoneyIcon, 
  FreeMoneyIcon, 
  VisaLogo, 
  MastercardLogo, 
  PayDunyaLogo 
} from './PaymentLogos.tsx';
import { api } from '../lib/api.ts';

export interface PayDunyaModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemPriceFCFA: number;
  itemPriceEUR?: number;
  planId?: string;
  creditsAdded?: number;
  companyName?: string;
  clientPhone?: string;
  companyEmail?: string;
  isVipFree?: boolean;
  onPaymentSuccess?: (transaction: any) => void;
}

export const PayDunyaModal: React.FC<PayDunyaModalProps> = ({
  isOpen,
  onClose,
  itemName,
  itemPriceFCFA,
  itemPriceEUR,
  planId = 'pro',
  creditsAdded,
  companyName,
  clientPhone: initialPhone,
  companyEmail,
  isVipFree: propIsVip,
  onPaymentSuccess
}) => {
  const isVipUser = propIsVip || companyEmail?.toLowerCase() === 'mgaye60000@gmail.com';
  const effectivePriceFCFA = isVipUser ? 0 : itemPriceFCFA;
  const effectivePriceEUR = isVipUser ? 0 : itemPriceEUR;
  const [selectedMethod, setSelectedMethod] = useState<'Wave' | 'Orange Money' | 'Carte Bancaire' | 'Free Money'>('Wave');
  const [phone, setPhone] = useState(initialPhone || '');
  const [fullName, setFullName] = useState(companyName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'processing' | 'redirect' | 'success'>('select');
  const [liveRedirectUrl, setLiveRedirectUrl] = useState<string | null>(null);
  const [currentRefCommand, setCurrentRefCommand] = useState<string>('');
  const [paidTx, setPaidTx] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const paymentMethods = [
    {
      id: 'Wave' as const,
      name: 'Wave Sénégal',
      badge: '🇸🇳 Recommandé',
      color: 'bg-sky-500 text-white',
      desc: 'Paiement sans frais via votre application Wave (Sénégal)',
      icon: Smartphone
    },
    {
      id: 'Orange Money' as const,
      name: 'Orange Money Sénégal',
      badge: '🇸🇳 Code OTP / #144#',
      color: 'bg-amber-600 text-white',
      desc: 'Validation instantanée par code OTP Orange Money',
      icon: Smartphone
    },
    {
      id: 'Carte Bancaire' as const,
      name: 'Carte Bancaire (Visa / Mastercard)',
      badge: '🌍 International',
      color: 'bg-emerald-600 text-white',
      desc: 'Toutes cartes bancaires africaines et internationales sécurisées',
      icon: CreditCard
    },
    {
      id: 'Free Money' as const,
      name: 'Free Money Sénégal',
      badge: '🇸🇳 Sénégal',
      color: 'bg-rose-600 text-white',
      desc: 'Paiement direct avec votre portefeuille Free Money',
      icon: Smartphone
    }
  ];

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setStep('processing');

    // 100% Free VIP Bypass exclusively for mgaye60000@gmail.com
    if (isVipUser) {
      setTimeout(() => {
        const tx = {
          refCommand: `VIP-FREE-${Date.now()}`,
          amount: 0,
          paymentMethod: 'Accès VIP 100% Gratuit (0 FCFA)'
        };
        setPaidTx(tx);
        setStep('success');
        setIsLoading(false);
        if (onPaymentSuccess) {
          onPaymentSuccess(tx);
        }
      }, 600);
      return;
    }

    try {
      const response = await fetch('/api/paydunya/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`
        },
        body: JSON.stringify({
          planId,
          paymentMethod: selectedMethod,
          clientName: fullName,
          clientPhone: phone
        })
      });

      const data = await response.json();

      if (data.success && data.redirectUrl && data.redirectUrl.startsWith('http')) {
        setCurrentRefCommand(data.refCommand);
        setLiveRedirectUrl(data.redirectUrl);
        setStep('redirect');
        setIsLoading(false);
        return;
      } else {
        setErrorMsg(data.error || "Impossible d'initialiser PayDunya. Vérifiez la configuration marchande.");
        setStep('select');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur de connexion avec la passerelle PayDunya.");
      setStep('select');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paydunya-modal-title"
    >
      <div 
        className="w-full max-w-lg neu-flat rounded-3xl p-6 md:p-8 border border-white/60 relative overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-400/15 via-teal-400/10 to-transparent blur-2xl pointer-events-none rounded-full" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg overflow-hidden shadow-xs">
                <PayDunyaLogo className="h-5 w-auto" />
              </div>
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                Sécurisé SSL 256-bit
              </span>
            </div>
            <h2 id="paydunya-modal-title" className="text-xl font-black text-slate-900 tracking-tight">
              {step === 'success' ? 'Paiement Confirmé !' : 'Règlement Sécurisé en Ligne'}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer la boîte de paiement PayDunya"
            className="w-9 h-9 rounded-full neu-btn flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* STEP 1: SELECT METHOD & CLIENT INFO */}
        {step === 'select' && (
          <form onSubmit={handleStartPayment} className="space-y-5">
            {/* Price banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                  {isVipUser ? 'Accès VIP Exclusif (M. Gaye)' : 'Total à régler'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {effectivePriceFCFA.toLocaleString()} <span className="text-sm font-extrabold text-emerald-700">FCFA</span>
                  </span>
                  {isVipUser && (
                    <span className="text-xs line-through text-slate-400">
                      {itemPriceFCFA.toLocaleString()} FCFA
                    </span>
                  )}
                  {!isVipUser && itemPriceEUR && (
                    <span className="text-xs text-slate-500">({itemPriceEUR} €)</span>
                  )}
                </div>
                {isVipUser && (
                  <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                    ⭐ 100% Gratuit à vie pour mgaye60000@gmail.com
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-700 block max-w-[160px] truncate">{itemName}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {isVipUser ? 'Crédits Illimités' : `+${creditsAdded?.toLocaleString()} crédits`}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Methods selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2.5">
                Sélectionnez votre moyen de paiement au Sénégal :
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {paymentMethods.map((m) => {
                  const isSelected = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-500/50'
                          : 'border-slate-200 neu-btn hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {m.id === 'Wave' && (
                          <div className="shadow-xs rounded-xl overflow-hidden">
                            <WaveIcon className="w-8 h-8" />
                          </div>
                        )}
                        {m.id === 'Orange Money' && (
                          <div className="shadow-xs rounded-xl overflow-hidden">
                            <OrangeMoneyIcon className="w-8 h-8" />
                          </div>
                        )}
                        {m.id === 'Free Money' && (
                          <div className="shadow-xs rounded-xl overflow-hidden">
                            <FreeMoneyIcon className="w-8 h-8" />
                          </div>
                        )}
                        {m.id === 'Carte Bancaire' && (
                          <div className="flex items-center gap-1">
                            <VisaLogo className="h-6 w-auto" />
                            <MastercardLogo className="h-6 w-auto" />
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {m.badge}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 block truncate">{m.name}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Client info inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Numéro Mobile (Wave / OM) *
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="77 000 00 00"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl neu-pressed text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Nom ou Entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Teranga Commerce"
                  className="w-full px-3 py-2.5 rounded-xl neu-pressed text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !phone}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isVipUser ? '⭐ Activer Gratuitement (Accès VIP 0 FCFA)' : `Valider ${itemPriceFCFA.toLocaleString()} FCFA avec PayDunya`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-semibold text-center">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Opéré par PayDunya Sénégal — Wave, Orange Money, Free Money & CB acceptés</span>
            </div>
          </form>
        )}

        {/* STEP: PROCESSING */}
        {step === 'processing' && (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Connexion sécurisée PayDunya...</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Génération de la facture PayDunya de {itemPriceFCFA.toLocaleString()} FCFA pour {selectedMethod}.
              </p>
            </div>
          </div>
        )}

        {/* STEP: REDIRECT TO PAYDUNYA LIVE CHECKOUT */}
        {step === 'redirect' && (
          <div className="py-6 space-y-5 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-8 h-8 text-emerald-700" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">Guichet PayDunya Prêt !</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Votre lien de paiement officiel a été généré sur les serveurs de PayDunya Sénégal.
              </p>
            </div>

            <div className="p-4 rounded-2xl neu-pressed space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Montant à régler :</span>
                <span className="font-black text-emerald-700">{itemPriceFCFA.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Réf Commande :</span>
                <span className="font-mono text-slate-800 font-bold">{currentRefCommand}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {liveRedirectUrl && (
                <a
                  href={liveRedirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ouvrir le Guichet PayDunya Officiel</span>
                </a>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Chiffrement bancaire 256 bits certifié PayDunya</span>
            </div>
          </div>
        )}

        {/* STEP: SUCCESS */}
        {step === 'success' && (
          <div className="py-6 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">Paiement Validé avec Succès !</h3>
              <p className="text-xs text-slate-500 mt-1">
                Votre transaction PayDunya a été enregistrée et votre forfait est immédiatement actif.
              </p>
            </div>

            <div className="p-4 rounded-2xl neu-pressed text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Article / Forfait :</span>
                <span className="font-bold text-slate-900">{itemName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Montant réglé :</span>
                <span className="font-black text-emerald-700">{itemPriceFCFA.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Moyen de paiement :</span>
                <span className="font-bold text-slate-900">{selectedMethod}</span>
              </div>
              {paidTx?.refCommand && (
                <div className="flex justify-between text-slate-600">
                  <span>Réf commande :</span>
                  <span className="font-mono text-[11px] text-slate-700">{paidTx.refCommand}</span>
                </div>
              )}
              {creditsAdded && (
                <div className="flex justify-between text-emerald-700 font-extrabold pt-1 border-t border-slate-200">
                  <span>Crédits IA alloués :</span>
                  <span>+{creditsAdded.toLocaleString()} crédits</span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              Accéder à mes services
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
