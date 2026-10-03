import React, { useState } from 'react';
import { Check, Sparkles, ShieldCheck, Smartphone, Globe } from 'lucide-react';
import { PayDunyaModal } from './PayDunyaModal.tsx';
import { WaveLogo, OrangeMoneyLogo, FreeMoneyLogo, VisaLogo, MastercardLogo, PayDunyaLogo } from './PaymentLogos.tsx';
import { useLocale, AppCurrency } from '../lib/i18n';

interface PricingSectionProps {
  onSelectPlan: (plan: 'starter' | 'pro' | 'business' | 'enterprise_125k') => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const { lang, currency, setCurrency, formatPlanPrice } = useLocale();
  const isEn = lang === 'en';

  const [selectedPlanToPay, setSelectedPlanToPay] = useState<{
    id: string;
    name: string;
    priceFCFA: number;
    priceEUR: number;
    credits: number;
  } | null>(null);


  const plans = [
    {
      id: 'starter' as const,
      name: 'STARTER',
      priceFCFA: 12500,
      priceEUR: 19,
      priceUSD: 21,
      period: isEn ? '/ month' : '/ mois',
      desc: isEn
        ? 'Ideal to get started with a dedicated AI agent and your first connected WhatsApp account.'
        : 'Idéal pour démarrer avec un agent IA dédié et votre premier compte WhatsApp connecté.',
      creditsNum: 2500,
      credits: isEn ? '2,500 AI credits / month' : '2 500 crédits IA / mois',
      features: isEn
        ? [
            '1 Dedicated operational AI Agent',
            '1 Synchronized WhatsApp Account',
            'Instant AI Auto-Responder 24/7',
            'Appointments & Reservations',
            'Visa, Mastercard, Wave & OM',
            'Support & maintenance included'
          ]
        : [
            '1 Agent IA dédié opérationnel',
            '1 Compte WhatsApp synchronisé',
            'Répondeur IA instantané 24/7',
            'Prise de rendez-vous & réservations',
            'Paiement CB, Wave & Orange Money',
            'Support & maintenance inclus'
          ]
    },
    {
      id: 'pro' as const,
      name: 'PRO',
      priceFCFA: 25000,
      priceEUR: 39,
      priceUSD: 42,
      period: isEn ? '/ month' : '/ mois',
      popular: true,
      desc: isEn
        ? 'The most popular choice for active retail stores, restaurants, and clinics.'
        : 'La formule plébiscitée par les commerces, restaurants et cabinets actifs.',
      creditsNum: 6000,
      credits: isEn ? '6,000 AI credits / month' : '6 000 crédits IA / mois',
      features: isEn
        ? [
            '2 Customizable AI Agents',
            '2 Synchronized WhatsApp Accounts',
            'Private Knowledge Base (Menus & Docs)',
            'Full Order & Cart Management',
            'Automated Quotes & Billing links',
            'Human handoff for urgent requests',
            'Visa, Mastercard, Wave & OM',
            'Priority support included'
          ]
        : [
            '2 Agents IA personnalisables',
            '2 Comptes WhatsApp synchronisés',
            'Base de connaissances (Menus & Docs)',
            'Gestion complète commandes & paniers',
            'Liens de facturation automatiques',
            'Escalade humaine en cas d\'urgence',
            'Paiement CB, Wave & Orange Money',
            'Support prioritaire inclus'
          ]
    },
    {
      id: 'business' as const,
      name: 'BUSINESS',
      priceFCFA: 95000,
      priceEUR: 149,
      priceUSD: 159,
      period: isEn ? '/ month' : '/ mois',
      desc: isEn
        ? 'For multi-location businesses, franchises, and high-volume WhatsApp operations.'
        : 'Pour les entreprises multi-sites, franchises et forts volumes d\'échanges WhatsApp.',
      creditsNum: 35000,
      credits: isEn ? '35,000 AI credits / month' : '35 000 crédits IA / mois',
      features: isEn
        ? [
            '4 Specialized AI Agents',
            '4 Simultaneous WhatsApp Numbers',
            'High-speed isolated data vault',
            'Dedicated 24/7 priority support',
            'Custom workflows & integrations',
            'Visa, Mastercard, Wave & OM',
            'Personalized onboarding'
          ]
        : [
            '4 Agents IA spécialisés',
            '4 Numéros WhatsApp simultanés',
            'Base de données isolée haute vitesse',
            'Support prioritaire 7j/7 dédié',
            'Sur-mesure & intégrations API',
            'Paiement CB, Wave & Orange Money',
            'Accompagnement personnalisé'
          ]
    },
    {
      id: 'enterprise_125k' as const,
      name: isEn ? 'ENTERPRISE VIP' : 'ENTREPRISE VIP',
      priceFCFA: 125000,
      priceEUR: 190,
      priceUSD: 205,
      period: isEn ? '/ month' : '/ mois',
      desc: isEn
        ? 'Unlocks per-agent dashboard filtering and unlimited AI agents for large organizations.'
        : 'Formule débloquant le filtrage du Dashboard par Agent IA créé et agents illimités.',
      creditsNum: 60000,
      credits: isEn ? '60,000 AI credits / month' : '60 000 crédits IA / mois',
      features: isEn
        ? [
            'Dashboard filtering by AI Agent',
            'Unlimited AI Agents with strict roles',
            'Unlimited WhatsApp numbers',
            'Smart query routing',
            'Unlimited Knowledge Vault',
            'Visa, Mastercard, Wave & OM',
            'Dedicated 24/7 engineer support'
          ]
        : [
            'Filtrage du Dashboard par Agent IA créé',
            'Agents IA illimités avec rôles stricts',
            'Numéros WhatsApp illimités',
            'Routage intelligent des questions',
            'Base documentaire illimitée',
            'Paiement CB, Wave & Orange Money',
            'Accompagnement ingénieur dédié 24/7'
          ]
    }
  ];

  const handlePlanClick = (p: typeof plans[0]) => {
    onSelectPlan(p.id);
  };

  return (
    <section className="py-14 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto bg-white">
      <div className="text-center space-y-4 mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0052CC]">
          <ShieldCheck className="w-4 h-4" />
          <span>
            {isEn
              ? 'International & Mobile Money Checkout'
              : 'Paiements Internationaux CB & Mobile Money'}
          </span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 font-display tracking-tight">
          {isEn
            ? 'Transparent Multi-Currency Pricing'
            : 'Des Tarifs Clairs et Adaptés à Votre Devise'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          {isEn
            ? 'Select your preferred currency below and activate your WhatsApp AI agents immediately.'
            : 'Choisissez votre devise d\'affichage ci-dessous et activez vos agents IA WhatsApp immédiatement.'}
        </p>

        {/* International Currency Switcher */}
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-slate-100 border border-slate-200/80">
          <Globe className="w-4 h-4 text-[#0052CC] ml-2 mr-1" />
          {(['XOF', 'EUR', 'USD'] as AppCurrency[]).map((curr) => (
            <button
              key={curr}
              type="button"
              onClick={() => setCurrency(curr)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                currency === curr
                  ? 'bg-[#0052CC] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {curr === 'XOF' ? 'FCFA (XOF)' : curr === 'EUR' ? 'EUR (€)' : 'USD ($)'}
            </button>
          ))}
        </div>

        {/* Certified Payment Logos */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <div className="shadow-xs rounded-xl overflow-hidden border border-slate-100" title="Visa">
            <VisaLogo className="h-6 w-auto" />
          </div>
          <div className="shadow-xs rounded-xl overflow-hidden border border-slate-100" title="Mastercard">
            <MastercardLogo className="h-6 w-auto" />
          </div>
          <div className="shadow-xs rounded-xl overflow-hidden border border-slate-100" title="Wave">
            <WaveLogo className="h-6 w-auto" />
          </div>
          <div className="shadow-xs rounded-xl overflow-hidden border border-slate-100" title="Orange Money">
            <OrangeMoneyLogo className="h-6 w-auto" />
          </div>
          <div className="shadow-xs rounded-xl overflow-hidden border border-slate-100" title="Free Money">
            <FreeMoneyLogo className="h-6 w-auto" />
          </div>
          <div className="shadow-xs rounded-xl overflow-hidden border border-slate-100" title="PayDunya">
            <PayDunyaLogo className="h-6 w-auto" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`p-6 sm:p-7 rounded-3xl flex flex-col justify-between transition-all relative ${
              p.popular
                ? 'bg-white border-2 border-[#0052CC] shadow-xl shadow-blue-600/10'
                : 'bg-[#F8FAFC] border border-slate-200/80 hover:border-blue-200'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#0052CC] text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md">
                {isEn ? 'Most Popular' : 'Le Plus Populaire'}
              </span>
            )}

            <div>
              <div className="mb-2">
                <h3 className="text-base font-extrabold text-slate-950 font-display">{p.name}</h3>
              </div>

              <div className="flex items-baseline gap-1.5 my-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-display">
                  {formatPlanPrice(p.priceFCFA, p.priceEUR, p.priceUSD)}
                </span>
                <span className="text-xs font-bold text-slate-500">{p.period}</span>
              </div>

              <div className="text-[11px] text-slate-400 font-medium mb-4">
                {currency === 'XOF'
                  ? `≈ ${p.priceEUR} € / $${p.priceUSD}`
                  : `${p.priceFCFA.toLocaleString()} FCFA`}
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-5">
                {p.desc}
              </p>

              <div className="p-3 rounded-2xl bg-[#EFF6FF] text-xs font-bold text-[#0052CC] mb-6 flex items-center justify-between">
                <span>{p.credits}</span>
                <Sparkles className="w-3.5 h-3.5 text-[#0052CC]" />
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700 mb-8">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#0052CC] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handlePlanClick(p)}
              className={`w-full py-3.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                p.popular
                  ? 'bg-[#0052CC] hover:bg-[#0041A3] text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-950 hover:bg-[#0052CC] text-white'
              }`}
            >
              <span>{isEn ? 'Subscribe Now' : 'Choisir ce forfait'}</span>
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </section>
  );
};
