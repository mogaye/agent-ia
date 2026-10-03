import React, { useState } from 'react';
import { 
  QrCode, 
  Bot, 
  ArrowRight, 
  Sparkles, 
  Smartphone, 
  Settings
} from 'lucide-react';
import { useLocale } from '../lib/i18n';

interface HowItWorksPageProps {
  onStartNow: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onStartNow }) => {
  const { lang } = useLocale();
  const isEn = lang === 'en';
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: isEn ? 'Create your account in 30 seconds' : 'Créez votre compte en 30 secondes',
      subtitle: isEn ? 'Instant signup, no credit card required' : 'Inscription instantanée sans carte bancaire',
      desc: isEn
        ? 'Enter your business name and verify your WhatsApp number with a secure 6-digit code.'
        : 'Renseignez le nom commercial de votre entreprise et validez votre numéro WhatsApp avec un code sécurisé à 6 chiffres.',
      icon: Smartphone,
      preview: {
        badge: isEn ? 'Step 1: Fast Activation' : 'Étape 1 : Activation rapide',
        title: isEn ? 'Secure Mobile Verification' : 'Validation Mobile Sécurisée',
        detail: isEn
          ? '6-digit OTP code sent directly to your WhatsApp or via SMS to certify your business identity.'
          : 'Code OTP 6 chiffres envoyé directement sur votre WhatsApp ou par SMS pour certifier votre identité entreprise.',
        visualType: 'otp'
      }
    },
    {
      num: '02',
      title: isEn ? 'Connect your WhatsApp via QR scan' : 'Reliez votre WhatsApp par simple scan QR',
      subtitle: isEn ? 'Official WhatsApp Web multi-device technology' : 'Technologie sécurisée WhatsApp Web',
      desc: isEn
        ? 'Open WhatsApp on your smartphone, go to "Linked Devices" and scan the displayed QR Code in 10 seconds.'
        : 'Aucune démarche fastidieuse. Ouvrez WhatsApp sur votre smartphone, allez dans « Appareils connectés » et scannez le QR Code affiché.',
      icon: QrCode,
      preview: {
        badge: isEn ? 'Step 2: Instant Pairing' : 'Étape 2 : Connexion instantanée',
        title: isEn ? 'QR Code Pairing in 10 Seconds' : 'Appairage QR Code en 10 secondes',
        detail: isEn
          ? 'Your existing chats remain intact. SMG Flow acts as an intelligent co-pilot on your existing line.'
          : 'Vos conversations existantes restent intactes. SMG Flow agit comme un co-pilote intelligent sur votre ligne existante.',
        visualType: 'qr'
      }
    },
    {
      num: '03',
      title: isEn ? 'Provide instructions in natural language' : 'Transmettez vos consignes en français naturel',
      subtitle: isEn ? 'No-code customization & PDF upload' : 'Personnalisation sans code',
      desc: isEn
        ? 'Specify your business rules, opening hours, or upload your PDF catalog and price list.'
        : 'Indiquez vos règles métier : "Réservation max 8 personnes", "Livraison sous 2h", ou uploadez votre catalogue produit.',
      icon: Settings,
      preview: {
        badge: isEn ? 'Step 3: AI Knowledge Base' : 'Étape 3 : Cerveau de l\'Agent IA',
        title: isEn ? 'Private Knowledge Base' : 'Base de Connaissances Privée',
        detail: isEn
          ? 'Your AI Agent learns your prices, availability, opening hours, and delivery policy to answer with precision.'
          : 'L\'Agent IA apprend vos tarifs, disponibilités, horaires et politique de livraison pour répondre avec exactitude.',
        visualType: 'rules'
      }
    },
    {
      num: '04',
      title: isEn ? 'Your AI Agent operates 24/7' : 'Votre Agent IA prend le relais 24/7',
      subtitle: isEn ? 'Full autonomy day and night' : 'Autonomie totale jour et nuit',
      desc: isEn
        ? 'It greets prospects, records orders, books appointments, and collects payments via Visa, Mastercard, Wave & Orange Money.'
        : 'Il accueille vos prospects instantanément, enregistre les commandes, réserve les créneaux et encaisse via PayDunya (Wave, OM & Cartes).',
      icon: Bot,
      preview: {
        badge: isEn ? 'Step 4: Live Operations' : 'Étape 4 : Déploiement actif',
        title: isEn ? '24/7 Autonomous Operations' : 'Opérations Autonomes 24h/24',
        detail: isEn
          ? 'Live activity reports, automated order syncing to your dashboard, and instant payment links.'
          : 'Rapports d\'activité en direct, transmission automatique des commandes et encaissement sécurisé.',
        visualType: 'live'
      }
    }
  ];

  const current = steps[activeStep];
  const StepIcon = current.icon;

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-10 sm:space-y-12 bg-white animate-page-in">
      {/* Header */}
      <div className="text-center space-y-3 animate-fade-down">
        <span className="text-xs font-mono font-bold text-[#0052CC] uppercase tracking-wider inline-flex items-center gap-1.5 bg-[#EBF2FF] border border-[#0052CC]/15 px-3.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-[#0052CC]" />
          <span>{isEn ? 'Step-by-Step Guide' : 'Guide Pas-à-Pas'}</span>
        </span>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#0A0A0A] font-display tracking-tight">
          {isEn ? 'How SMG Flow Works' : 'Comment fonctionne SMG Flow'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          {isEn
            ? 'From initial signup to your first automated orders and appointments on WhatsApp.'
            : 'De la première inscription jusqu\'à vos premières réservations et commandes gérées par l\'IA.'}
        </p>
      </div>

      {/* Interactive 4-Step Navigator Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up">
        {steps.map((s, idx) => {
          const isSelected = activeStep === idx;
          const Icon = s.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-2xl text-left transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-md'
                  : 'bg-[#F8FAFC] text-slate-800 border-slate-200 hover:border-[#0052CC]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-base font-extrabold font-display ${isSelected ? 'text-white' : 'text-[#0052CC]'}`}>
                  {s.num}
                </span>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#0052CC]'}`} />
              </div>
              <div className={`text-xs font-extrabold line-clamp-1 ${isSelected ? 'text-white' : 'text-[#0A0A0A]'}`}>
                {s.title}
              </div>
              <div className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                {s.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Showcase Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-zoom-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC] shrink-0">
              <StepIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#0052CC] uppercase bg-[#EBF2FF] px-2.5 py-0.5 rounded-full inline-block mb-1">
                {current.preview.badge}
              </span>
              <h2 className="text-base sm:text-xl font-extrabold text-[#0A0A0A]">
                {current.title}
              </h2>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-xl sm:text-3xl font-black text-[#0052CC] font-display">
              {current.num} / 04
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[#0A0A0A]">
              {current.preview.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {current.desc}
            </p>
            <p className="text-xs text-slate-700 font-medium leading-relaxed bg-[#F8FAFC] border border-slate-200/80 p-3.5 rounded-2xl">
              💡 {current.preview.detail}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => prev - 1)}
                  className="bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-full text-xs font-extrabold text-slate-700 cursor-pointer"
                >
                  {isEn ? 'Previous step' : 'Étape précédente'}
                </button>
              )}
              {activeStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(prev => prev + 1)}
                  className="bg-[#0052CC] hover:bg-[#003E99] text-white px-5 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>{isEn ? 'Next step' : 'Étape suivante'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartNow}
                  className="bg-[#0052CC] hover:bg-[#003E99] text-white px-6 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>{isEn ? 'Activate my AI Agent now' : 'Activer mon Agent maintenant'}</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive visual mockup depending on step */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#F8FAFC] border border-slate-200/80 space-y-4 text-center">
            {current.preview.visualType === 'otp' && (
              <div className="space-y-3 py-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC]">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="text-xs font-extrabold text-[#0A0A0A]">
                  {isEn ? 'WhatsApp Number Verification' : 'Validation Numéro WhatsApp'}
                </div>
                <div className="flex justify-center gap-2 font-mono">
                  {['•', '•', '•', '•', '•', '•'].map((n, i) => (
                    <div key={i} className="w-8 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm shadow-2xs">
                      {n}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold block">
                  {isEn ? 'Secure OTP verification' : 'Vérification sécurisée par code OTP'}
                </span>
              </div>
            )}

            {current.preview.visualType === 'qr' && (
              <div className="space-y-3 py-2">
                <div className="w-32 h-32 mx-auto rounded-2xl p-2 flex items-center justify-center bg-white border border-slate-200 shadow-sm">
                  <QrCode className="w-24 h-24 text-[#0A0A0A]" />
                </div>
                <div className="text-xs font-extrabold text-[#0A0A0A]">
                  {isEn ? 'Scan with your WhatsApp' : 'Scannez avec votre WhatsApp'}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {isEn ? 'Settings > Linked Devices > Link a Device' : 'Paramètres > Appareils connectés > Connecter un appareil'}
                </div>
              </div>
            )}

            {current.preview.visualType === 'rules' && (
              <div className="space-y-2.5 py-2 text-left">
                <div className="text-xs font-extrabold text-[#0A0A0A] mb-2 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-[#0052CC]" />
                  <span>{isEn ? 'Your Agent Instructions:' : 'Consignes de votre Agent :'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] font-medium text-slate-700">
                  ✅ {isEn ? 'Opening hours and location configured' : 'Horaires et adresse configurés par vos soins'}
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] font-medium text-slate-700">
                  ✅ {isEn ? 'Product catalog & business rules indexed' : 'Catalogue et règles métier personnalisés'}
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] font-medium text-slate-700">
                  ✅ {isEn ? 'Global & Mobile Money payments enabled' : 'Moyens de paiement configurés'}
                </div>
              </div>
            )}

            {current.preview.visualType === 'live' && (
              <div className="space-y-3 py-2 text-left">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-[#0A0A0A]">
                    {isEn ? 'Live Dashboard Sync' : 'Synchronisation en direct'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200 text-[11px] space-y-1">
                  <div className="text-slate-400 font-mono text-[9px] uppercase">
                    {isEn ? 'Operations' : 'Opérations'}
                  </div>
                  <div className="font-bold text-slate-800">
                    {isEn ? 'Orders and bookings synced to Dashboard' : 'Commandes et réservations synchronisées sur le Dashboard'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-200 text-[11px] space-y-1">
                  <div className="text-slate-400 font-mono text-[9px] uppercase">
                    {isEn ? 'Payments' : 'Paiements'}
                  </div>
                  <div className="font-bold text-emerald-700">
                    {isEn ? 'Direct payout via Card, Wave & Orange Money' : 'Encaissement direct sur vos comptes configurés'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-2 animate-fade-up">
        <button
          onClick={onStartNow}
          className="bg-[#0052CC] hover:bg-[#003E99] text-white px-8 py-4 rounded-full text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer shadow-md transition-all"
        >
          <span>{isEn ? 'Create My AI Agent in 30 Seconds' : 'Créer mon Agent IA en 30 secondes'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
