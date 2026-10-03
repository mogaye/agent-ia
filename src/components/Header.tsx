import React, { useState } from 'react';
import {
  Smartphone,
  Globe,
  Menu,
  X,
  Home,
  Bot,
  Compass,
  CreditCard,
  User
} from 'lucide-react';
import { AuthSession } from '../types';
import { useLocale, AppCurrency } from '../lib/i18n';

interface HeaderProps {
  currentSession: AuthSession | null;
  onOpenAuth: (initialTab?: 'login' | 'register') => void;
  onCreateAgent?: () => void;
  onDirectDashboard?: () => void;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateAgents: () => void;
  onNavigateHowItWorks: () => void;
  onNavigatePricing: () => void;
  activeView: 'home' | 'agents' | 'how_it_works' | 'pricing';
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  onOpenAuth,
  onCreateAgent,
  onDirectDashboard,
  onLogout,
  onNavigateHome,
  onNavigateAgents,
  onNavigateHowItWorks,
  onNavigatePricing,
  activeView
}) => {
  const { lang, setLang, currency, setCurrency } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{
    id: 'home' | 'agents' | 'how_it_works' | 'pricing';
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    onClick: () => void;
  }> = [
    {
      id: 'home',
      label: lang === 'en' ? 'Home' : 'Accueil',
      shortLabel: lang === 'en' ? 'Home' : 'Accueil',
      icon: Home,
      onClick: () => {
        onNavigateHome();
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'agents',
      label: lang === 'en' ? 'AI Agents' : 'Agents IA',
      shortLabel: lang === 'en' ? 'Agents' : 'Agents IA',
      icon: Bot,
      onClick: () => {
        onNavigateAgents();
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'how_it_works',
      label: lang === 'en' ? 'How It Works' : 'Fonctionnement',
      shortLabel: lang === 'en' ? 'Guide' : 'Guide',
      icon: Compass,
      onClick: () => {
        onNavigateHowItWorks();
        setMobileMenuOpen(false);
      }
    },
    {
      id: 'pricing',
      label: lang === 'en' ? 'Pricing' : 'Tarifs',
      shortLabel: lang === 'en' ? 'Pricing' : 'Tarifs',
      icon: CreditCard,
      onClick: () => {
        onNavigatePricing();
        setMobileMenuOpen(false);
      }
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 animate-fade-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Camply-style Bold Typographic Logo */}
          <button
            onClick={() => {
              onNavigateHome();
              setMobileMenuOpen(false);
            }}
            className="flex items-center shrink-0 group cursor-pointer text-left focus:outline-none"
          >
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-950 font-display transition-transform group-hover:scale-[1.02] whitespace-nowrap">
              SMG Flow<span className="text-[#0052CC]">.</span>
            </span>
          </button>

          {/* Center: Clean Typography Navigation Links with Sliding Underline (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`relative py-2 transition-colors cursor-pointer group whitespace-nowrap ${
                    isActive ? 'text-[#0052CC] font-bold' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-[#0052CC] rounded-full transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Right: International Language/Currency Controls + Auth Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Language Switcher (FR / EN) */}
            <div className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200/70">
              <button
                type="button"
                onClick={() => setLang('fr')}
                className={`px-2 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'fr'
                    ? 'bg-white text-[#0052CC] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-[#0052CC] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>



            {/* Auth / Dashboard Buttons */}
            {currentSession ? (
              <div className="flex items-center gap-2">
                {onDirectDashboard && (
                  <button
                    onClick={onDirectDashboard}
                    className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#0052CC] hover:bg-[#0041A3] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 transition-all whitespace-nowrap"
                  >
                    <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">
                      {lang === 'en' ? 'Dashboard' : 'Tableau de Bord'}
                    </span>
                    <span className="sm:hidden">Console</span>
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-full border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-xs font-bold text-slate-700 hover:text-rose-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {lang === 'en' ? 'Sign Out' : 'Déconnexion'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold text-slate-700 hover:text-[#0052CC] hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap"
                >
                  {lang === 'en' ? 'Sign In' : 'Connexion'}
                </button>
                <button
                  onClick={() => (onCreateAgent ? onCreateAgent() : onOpenAuth('register'))}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#0052CC] hover:bg-[#0041A3] text-white text-xs sm:text-sm font-bold cursor-pointer shadow-md shadow-blue-600/20 transition-all whitespace-nowrap"
                >
                  {lang === 'en' ? 'Get Started' : "S'inscrire"}
                </button>
              </div>
            )}

            {/* Mobile Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Menu"
              className="md:hidden w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 cursor-pointer transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* International Mobile Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-5 space-y-5 shadow-2xl animate-fade-down">
            {/* International Preferences: Language & Currency */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#0052CC]" />
                  <span>{lang === 'en' ? 'Language' : 'Langue'}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLang('fr')}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                      lang === 'fr'
                        ? 'bg-[#0052CC] text-white'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    Français
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                      lang === 'en'
                        ? 'bg-[#0052CC] text-white'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-xs font-bold text-slate-500">
                  {lang === 'en' ? 'Currency' : 'Devise'}
                </span>
                <div className="flex items-center gap-1.5">
                  {(['XOF', 'EUR', 'USD'] as AppCurrency[]).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer ${
                        currency === curr
                          ? 'bg-slate-950 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {curr === 'XOF' ? 'FCFA' : curr === 'EUR' ? 'EUR €' : 'USD $'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0052CC] text-white border-[#0052CC]'
                        : 'bg-white text-slate-800 border-slate-200/80'
                    }`}
                  >
                    <IconComp
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-[#0052CC]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Auth Buttons in Mobile Menu */}
            {currentSession ? (
              <div className="flex flex-col gap-2 pt-1">
                {onDirectDashboard && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onDirectDashboard();
                    }}
                    className="w-full py-3 rounded-full bg-[#0052CC] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Open Dashboard' : 'Accéder au Tableau de Bord'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold cursor-pointer"
                >
                  {lang === 'en' ? 'Sign Out' : 'Déconnexion'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="py-3 rounded-full border border-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  {lang === 'en' ? 'Sign In' : 'Connexion'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onCreateAgent) onCreateAgent();
                    else onOpenAuth('register');
                  }}
                  className="py-3 rounded-full bg-[#0052CC] text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  {lang === 'en' ? 'Get Started' : "S'inscrire"}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Native International Mobile Bottom App Bar (Thumb-Friendly Navigation) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 grid grid-cols-5 gap-1 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
      >
        {navItems.map((item) => {
          const IconComp = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors cursor-pointer ${
                isActive ? 'text-[#0052CC]' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <IconComp className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-bold truncate max-w-full">
                {item.shortLabel}
              </span>
            </button>
          );
        })}

        {/* 5th Tab: Account / Sign In */}
        <button
          type="button"
          onClick={() => {
            if (currentSession && onDirectDashboard) {
              onDirectDashboard();
            } else {
              onOpenAuth('login');
            }
          }}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-[#0052CC] transition-colors cursor-pointer"
        >
          <User className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold truncate max-w-full">
            {currentSession
              ? lang === 'en'
                ? 'Console'
                : 'Console'
              : lang === 'en'
              ? 'Sign In'
              : 'Compte'}
          </span>
        </button>
      </nav>
    </>
  );
};
