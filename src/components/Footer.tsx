import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  FileText, 
  Globe,
  MessageSquare,
  QrCode,
  Database,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { LegalDocType } from './LegalModal.tsx';
import { 
  WaveLogo, 
  OrangeMoneyLogo, 
  FreeMoneyLogo, 
  VisaLogo, 
  MastercardLogo, 
  PayDunyaLogo 
} from './PaymentLogos.tsx';
import { useLocale } from '../lib/i18n';

interface FooterProps {
  onOpenLegal?: (doc: LegalDocType) => void;
  onNavigate?: (view: 'home' | 'agents' | 'how_it_works' | 'pricing') => void;
  onOpenAuth?: (tab: 'login' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onNavigate,
  onOpenAuth
}) => {
  const { lang } = useLocale();
  const isEn = lang === 'en';

  const handleLegalClick = (doc: LegalDocType, e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenLegal) {
      onOpenLegal(doc);
    }
  };

  const handleNavClick = (view: 'home' | 'agents' | 'how_it_works' | 'pricing', e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0052CC] text-white pt-16 sm:pt-20 pb-24 md:pb-12 px-4 sm:px-8 relative overflow-hidden">
      {/* Subtle decorative radial circles in the background like Camply */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full border border-white/5" />

      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-14 relative z-10">
        
        {/* 5-Column Camply Royal Blue Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 sm:gap-10">
          
          {/* Colonne 1 : Logo blanc SMG Flow. + présentation */}
          <div className="sm:col-span-2 space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-1">
              <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-white font-display">
                SMG Flow.
              </span>
            </div>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xs font-normal">
              {isEn
                ? 'The international platform to build, train, and connect autonomous AI agents directly to WhatsApp with integrated global and mobile payments.'
                : 'La plateforme internationale de référence pour créer, entraîner et connecter vos agents IA autonomes directement sur WhatsApp avec encaissements intégrés.'}
            </p>

            {/* Certified Payment Logos */}
            <div className="pt-1 space-y-2.5">
              <div className="text-[11px] font-semibold text-blue-200 tracking-wide">
                {isEn
                  ? 'Certified International & Mobile Payments'
                  : 'Paiements Internationaux & Mobile Money Certifiés'}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white/95 p-1 rounded-lg shadow-xs" title="Visa">
                  <VisaLogo className="h-5 w-auto" />
                </div>
                <div className="bg-white/95 p-1 rounded-lg shadow-xs" title="Mastercard">
                  <MastercardLogo className="h-5 w-auto" />
                </div>
                <div className="bg-white/95 p-1 rounded-lg shadow-xs" title="Wave">
                  <WaveLogo className="h-5 w-auto" />
                </div>
                <div className="bg-white/95 p-1 rounded-lg shadow-xs" title="Orange Money">
                  <OrangeMoneyLogo className="h-5 w-auto" />
                </div>
                <div className="bg-white/95 p-1 rounded-lg shadow-xs" title="Free Money">
                  <FreeMoneyLogo className="h-5 w-auto" />
                </div>
                <div className="bg-white/95 p-1 rounded-lg shadow-xs" title="PayDunya">
                  <PayDunyaLogo className="h-5 w-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Colonne 2 : Plateforme */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide font-display">
              {isEn ? 'Platform' : 'Plateforme'}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-blue-100/85">
              <li>
                <button
                  onClick={(e) => handleNavClick('home', e)}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left"
                >
                  {isEn ? 'Home' : 'Accueil'}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNavClick('agents', e)}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left"
                >
                  {isEn ? 'AI Agents' : 'Agents IA'}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNavClick('how_it_works', e)}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left"
                >
                  {isEn ? 'How It Works' : 'Fonctionnement'}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNavClick('pricing', e)}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left"
                >
                  {isEn ? 'Pricing' : 'Tarifs'}
                </button>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Ressources */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide font-display">
              {isEn ? 'Resources' : 'Ressources'}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-blue-100/85">
              <li>
                <button
                  onClick={() => onOpenAuth?.('register')}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>{isEn ? 'AI Builder' : "Créateur d'IA"}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNavClick('how_it_works', e)}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left flex items-center gap-2"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-200" />
                  <span>{isEn ? 'QR Connection' : 'Connexion QR'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleNavClick('how_it_works', e)}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left flex items-center gap-2"
                >
                  <Database className="w-3.5 h-3.5 text-blue-200" />
                  <span>{isEn ? 'Knowledge Vault' : 'Base de données'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAuth?.('login')}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left font-semibold text-white"
                >
                  {isEn ? 'Client Portal' : 'Espace Client'}
                </button>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Légal & Support */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide font-display">
              {isEn ? 'Legal & Security' : 'Légal & Support'}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-blue-100/85">
              <li>
                <button
                  onClick={(e) => handleLegalClick('legal_notices', e)}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-200" />
                  <span>{isEn ? 'Legal Notices' : 'Mentions légales'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLegalClick('terms', e)}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-200" />
                  <span>{isEn ? 'Terms of Service' : 'CGU / CGV'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLegalClick('privacy', e)}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left flex items-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5 text-blue-200" />
                  <span>{isEn ? 'Privacy Policy' : 'Confidentialité'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleLegalClick('security', e)}
                  className="hover:text-white hover:translate-x-1 transition-all cursor-pointer text-left flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                  <span>{isEn ? 'Security' : 'Sécurité'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Colonne 5 : Contact */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide font-display">
              Contact
            </h4>
            <div className="space-y-4 text-xs sm:text-sm text-blue-100/90">
              <a
                href="mailto:contact@smgflow.pro"
                className="block hover:text-white transition-colors font-medium break-all"
              >
                contact@smgflow.pro
              </a>

              <div className="flex items-center gap-2.5 pt-1">
                <a
                  href="mailto:contact@smgflow.pro"
                  title="Email"
                  className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white hover:text-[#0052CC] hover:scale-110 transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <button
                  onClick={() => onOpenAuth?.('login')}
                  title="WhatsApp AI"
                  className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white hover:text-[#0052CC] hover:scale-110 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleNavClick('home', e)}
                  title="Web"
                  className="w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white hover:text-[#0052CC] hover:scale-110 transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-blue-200 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{isEn ? 'Active 24/7 Worldwide' : 'Service actif 24h/24 — 7j/7'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Fine Bottom Divider & Centered Copyright */}
        <div className="border-t border-white/15 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-100/80">
          <div>
            © {new Date().getFullYear()} SMG Flow.{' '}
            {isEn ? 'All rights reserved.' : 'Tous droits réservés.'}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <button
              onClick={(e) => handleLegalClick('legal_notices', e)}
              className="hover:text-white cursor-pointer transition-colors"
            >
              {isEn ? 'Legal Notices' : 'Mentions Légales'}
            </button>
            <button
              onClick={(e) => handleLegalClick('terms', e)}
              className="hover:text-white cursor-pointer transition-colors"
            >
              {isEn ? 'Terms' : 'CGU / CGV'}
            </button>
            <button
              onClick={(e) => handleLegalClick('privacy', e)}
              className="hover:text-white cursor-pointer transition-colors"
            >
              {isEn ? 'Privacy' : 'Confidentialité'}
            </button>
            <button
              onClick={(e) => handleLegalClick('security', e)}
              className="hover:text-white cursor-pointer transition-colors"
            >
              {isEn ? 'Security' : 'Sécurité'}
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
