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
  ExternalLink
} from 'lucide-react';
import { api } from '../lib/api.ts';

export interface PayTechModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemPriceFCFA: number;
  itemPriceEUR?: number;
  planId?: string;
  creditsAdded?: number;
  companyName?: string;
  clientPhone?: string;
  onPaymentSuccess?: (transaction: any) => void;
}

export const PayTechModal: React.FC<PayTechModalProps> = ({
  isOpen,
  onClose,
  itemName,
  itemPriceFCFA,
  itemPriceEUR,
  planId = 'pro',
  creditsAdded,
  companyName,
  clientPhone: initialPhone,
  onPaymentSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'Wave' | 'Orange Money' | 'Carte Bancaire' | 'Free Money'>('Wave');
  const [phone, setPhone] = useState(initialPhone || '');
  const [fullName, setFullName] = useState(companyName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select');
  const [paidTx, setPaidTx] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const paymentMethods = [
    {
      id: 'Wave' as const,
      name: 'Wave Sénégal',
      badge: '🇸🇳 Recommandé',
      color: 'bg-sky-500 text-white',
      desc: 'Paiement sans frais via votre compte Wave Sénégal',
      icon: Smartphone
    },
    {
      id: 'Orange Money' as const,
      name: 'Orange Money',
      badge: 'Afrique de l\'Ouest',
      color: 'bg-amber-600 text-white',
      desc: 'Validation directe avec l\'application Orange Money ou code OTP',
      icon: Smartphone
    },
    {
      id: 'Carte Bancaire' as const,
      name: 'Carte Bancaire (Visa / Mastercard)',
      badge: '🌍 International',
      color: 'bg-emerald-600 text-white',
      desc: 'Cartes bancaires africaines et internationales avec 3D Secure',
      icon: CreditCard
    },
    {
      id: 'Free Money' as const,
      name: 'Free Money',
      badge: 'Sénégal',
      color: 'bg-rose-600 text-white',
      desc: 'Validation directe avec votre portefeuille Free Money',
      icon: Smartphone
    }
  ];

  const handleStartPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/paytech/payment-request', {
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
        setStep('processing');
        window.location.href = data.redirectUrl;
        return;
      } else {
        setStep('select');
        setErrorMsg(data.error || "Impossible d'initialiser le paiement PayTech. Vérifiez la configuration marchande.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setStep('select');
      setErrorMsg(err?.message || "Erreur de connexion avec la passerelle PayTech.");
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paytech-modal-title"
    >
      <div 
        className="bg-[#ECF0F3] w-full max-w-lg rounded-3xl p-6 sm:p-8 neu-flat border border-white/80 shadow-2xl relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {step !== 'processing' && (
          <button
            onClick={onClose}
            aria-label="Fermer la boîte de paiement PayTech"
            className="absolute top-5 right-5 w-8 h-8 rounded-full neu-btn flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        )}

        {/* STEP 1: PAYMENT METHOD & DETAILS */}
        {step === 'select' && (
          <form onSubmit={handleStartPayment} className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-emerald-600 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 id="paytech-modal-title" className="text-lg font-extrabold text-slate-900">
                    Paiement Sécurisé PayTech
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Officiel 🇸🇳
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Wave • Orange Money • Free Money • Visa & Mastercard
                </p>
              </div>
            </div>

            {/* Item & Price Summary Card */}
            <div className="p-4 rounded-2xl neu-pressed border border-white/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                  Forfait sélectionné
                </span>
                <span className="text-sm font-extrabold text-slate-900 block mt-0.5 truncate max-w-[220px]">
                  {itemName}
                </span>
                {creditsAdded && (
                  <span className="text-[11px] text-sky-700 font-bold flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3" /> +{creditsAdded.toLocaleString()} crédits IA inclus
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-slate-900 font-display block">
                  {itemPriceFCFA.toLocaleString()} FCFA
                </span>
                {itemPriceEUR && (
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    ≈ {itemPriceEUR} € / mois
                  </span>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Choisissez votre moyen de paiement :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {paymentMethods.map((m) => {
                  const isSelected = selectedMethod === m.id;
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'neu-pressed border-sky-500/80 bg-sky-50/40 ring-1 ring-sky-500'
                          : 'neu-btn border-white/80 hover:bg-white/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-700' : 'text-slate-600'}`} />
                          <span className="text-xs font-extrabold text-slate-900">{m.name}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${m.color}`}>
                          {m.id === 'Wave' ? 'WAVE' : m.id === 'Orange Money' ? 'OM' : m.id === 'Free Money' ? 'FREE' : 'CB'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight">
                        {m.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nom ou Entreprise
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Teranga SARL"
                  className="w-full px-3 py-2 rounded-xl neu-pressed text-xs text-slate-800 outline-none border border-white/40"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: +221 77 123 45 67"
                  className="w-full px-3 py-2 rounded-xl neu-pressed text-xs text-slate-800 outline-none border border-white/40 font-mono"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl neu-btn-primary text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
              >
                <span>Payer {itemPriceFCFA.toLocaleString()} FCFA avec PayTech ({selectedMethod})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium mt-2.5">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Transaction cryptée certifiée PayTech Sénégal & SMG Flow</span>
              </div>
            </div>
          </form>
        )}

        {/* STEP 2: PROCESSING */}
        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl neu-pressed flex items-center justify-center text-sky-600 mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Redirection vers le terminal sécurisé PayTech...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Initialisation du paiement via <span className="font-bold text-slate-800">{selectedMethod}</span> ({itemPriceFCFA.toLocaleString()} FCFA).
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="py-6 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">
                Paiement Validé avec Succès !
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Votre transaction PayTech a été confirmée et créditée sur votre compte.
              </p>
            </div>

            {/* Receipt card */}
            <div className="p-4 rounded-2xl neu-pressed border border-white/40 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-[#D1D9E6]/70 pb-2">
                <span className="text-slate-500 font-medium">Réf. Transaction :</span>
                <span className="font-mono font-bold text-slate-800">{paidTx?.refCommand}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#D1D9E6]/70 pb-2">
                <span className="text-slate-500 font-medium">Mode de paiement :</span>
                <span className="font-bold text-sky-800">{paidTx?.paymentMethod || selectedMethod}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#D1D9E6]/70 pb-2">
                <span className="text-slate-500 font-medium">Montant réglé :</span>
                <span className="font-extrabold text-emerald-700 font-display">
                  {itemPriceFCFA.toLocaleString()} FCFA
                </span>
              </div>
              {creditsAdded && (
                <div className="flex justify-between items-center pt-1 text-sky-700 font-bold">
                  <span>Crédits IA alloués :</span>
                  <span>+{creditsAdded.toLocaleString()}</span>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl neu-btn-primary text-white text-xs font-extrabold cursor-pointer shadow-md"
            >
              Terminer & Accéder à mon Espace
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
