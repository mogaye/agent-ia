import React, { useState, useEffect } from 'react';
import { Cookie, Check } from 'lucide-react';
import { LegalDocType } from './LegalModal.tsx';
import { useLocale } from '../lib/i18n';

interface CookieBannerProps {
  onOpenLegal: (doc: LegalDocType) => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenLegal }) => {
  const { lang } = useLocale();
  const isEn = lang === 'en';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('smgflow_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('smgflow_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleRefuseNonEssential = () => {
    localStorage.setItem('smgflow_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label={isEn ? 'Cookie consent' : 'Consentement relatif aux cookies'}
      className="fixed bottom-20 md:bottom-5 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-45 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-2xl animate-fade-up"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC] shrink-0 mt-0.5">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-extrabold text-[#0A0A0A] font-display truncate">
              {isEn ? 'Your Privacy Matters' : 'Respect de votre vie privée'}
            </h4>
            <span className="text-[9px] font-mono text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
              GDPR / CDP
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {isEn
              ? 'We use essential technical cookies for secure platform operation and session persistence.'
              : 'Nous utilisons des cookies techniques nécessaires au fonctionnement sécurisé et à vos sessions.'}
          </p>
          <div className="pt-0.5">
            <button
              onClick={() => onOpenLegal('privacy')}
              className="text-[10px] text-[#0052CC] hover:underline font-bold cursor-pointer"
            >
              {isEn ? 'Learn more about your data' : 'En savoir plus sur vos données'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
        <button
          onClick={handleRefuseNonEssential}
          className="py-2 px-3 rounded-full bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 text-[11px] font-extrabold text-slate-700 cursor-pointer transition-all"
        >
          {isEn ? 'Essential only' : 'Essentiels'}
        </button>
        <button
          onClick={handleAccept}
          className="py-2 px-3 rounded-full bg-[#0052CC] hover:bg-[#003E99] text-white text-[11px] font-extrabold cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{isEn ? 'Accept all' : 'Accepter tout'}</span>
        </button>
      </div>
    </aside>
  );
};
