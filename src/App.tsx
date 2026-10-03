import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CamplyLandingPage } from './components/CamplyLandingPage';
import { PricingSection } from './components/PricingSection';
import { HowItWorksPage } from './components/HowItWorksPage';
import { AgentsHubPage } from './components/AgentsHubPage';
import { AuthModal } from './components/AuthModal';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { EnterpriseDashboard } from './components/EnterpriseDashboard';
import { CreateAgentWizard } from './components/CreateAgentWizard';
import { LegalModal, LegalDocType } from './components/LegalModal';
import { CookieBanner } from './components/CookieBanner';
import { AuthSession, CompanyProfile } from './types';
import { DEFAULT_COMPANY } from './data/mockData';
import { accountStorage, VIP_COMPANY } from './lib/accountStorage';

import { api } from './lib/api';
import { LocaleProvider } from './lib/i18n';

export const App: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<AuthSession | null>(null);
  const [activeCompany, setActiveCompany] = useState<CompanyProfile>(DEFAULT_COMPANY);
  const [activeView, setActiveView] = useState<'home' | 'agents' | 'how_it_works' | 'pricing'>('home');
  const [viewMode, setViewMode] = useState<'app' | 'landing'>('app');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [showPublicWizard, setShowPublicWizard] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocType>('legal_notices');

  // Verify session on mount with server (never trust localStorage alone)
  useEffect(() => {
    let isMounted = true;
    api.fetchMe().then((res) => {
      if (!isMounted) return;
      if (res.success && res.user) {
        setCurrentSession({
          role: res.user.role,
          userEmail: res.user.email,
          userName: res.user.fullName,
          companyId: res.user.companyId,
          companyName: res.user.companyName,
          isVipFree: res.user.isVipFree
        });
        if (res.company) {
          setActiveCompany(res.company);
        }
      } else {
        api.setToken(null);
        setCurrentSession(null);
      }
    }).catch(() => {
      if (isMounted) setCurrentSession(null);
    });
    return () => { isMounted = false; };
  }, []);

  const handleOpenAuth = (initialTab: 'login' | 'register' = 'login') => {
    setAuthInitialTab(initialTab);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (session: AuthSession, company?: CompanyProfile) => {
    setCurrentSession(session);
    if (company) {
      setActiveCompany(company);
    }
    setViewMode('app');
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentSession(null);
    setActiveView('home');
  };

  const [adminViewTarget, setAdminViewTarget] = useState<'super_admin' | 'enterprise_dashboard'>('super_admin');

  // If Super Admin logged in
  if (currentSession?.role === 'super_admin') {
    if (adminViewTarget === 'enterprise_dashboard' && viewMode === 'app') {
      return (
        <LocaleProvider>
          <div className="flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
            <div className="bg-[#0A0A0A] text-white px-3 sm:px-4 py-2 flex items-center justify-between gap-2 text-xs border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] shrink-0">
                  SUPER ADMIN
                </span>
                <span className="font-semibold truncate text-[11px] sm:text-xs">
                  Espace Entreprise & Agents IA
                </span>
              </div>
              <button
                onClick={() => setAdminViewTarget('super_admin')}
                className="px-3 py-1 rounded-full bg-[#0052CC] hover:bg-[#003E99] text-white font-extrabold text-[11px] sm:text-xs cursor-pointer transition-colors shrink-0"
              >
                ← Console Admin
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <EnterpriseDashboard
                company={activeCompany}
                onLogout={handleLogout}
                onViewLanding={() => setViewMode('landing')}
              />
            </div>
          </div>
        </LocaleProvider>
      );
    }

    if (viewMode === 'app') {
      return (
        <LocaleProvider>
          <SuperAdminDashboard
            onBackToLanding={() => setViewMode('landing')}
            onSelectCompanyForDashboard={(comp) => {
              setActiveCompany(comp);
              setAdminViewTarget('enterprise_dashboard');
            }}
          />
        </LocaleProvider>
      );
    }
  }

  // If Enterprise Client logged in
  if ((currentSession?.role === 'company_admin' || currentSession?.role === 'company_user' || currentSession?.role === 'enterprise') && viewMode === 'app') {
    return (
      <LocaleProvider>
        <EnterpriseDashboard
          company={activeCompany}
          onLogout={handleLogout}
          onViewLanding={() => setViewMode('landing')}
        />
      </LocaleProvider>
    );
  }

  // Public Landing & Pages
  return (
    <LocaleProvider>
      <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Header
        currentSession={currentSession}
        onOpenAuth={handleOpenAuth}
        onCreateAgent={() => currentSession ? setShowPublicWizard(true) : handleOpenAuth('register')}
        onDirectDashboard={currentSession ? () => setViewMode('app') : undefined}
        onLogout={handleLogout}
        onNavigateHome={() => setActiveView('home')}
        onNavigateAgents={() => setActiveView('agents')}
        onNavigateHowItWorks={() => setActiveView('how_it_works')}
        onNavigatePricing={() => setActiveView('pricing')}
        activeView={activeView}
      />

      <main className="flex-1 overflow-hidden">
        <div key={activeView} className="animate-page-in">
          {activeView === 'home' && (
            <CamplyLandingPage
              onOpenAuth={handleOpenAuth}
              onCreateAgent={() => currentSession ? setShowPublicWizard(true) : handleOpenAuth('register')}
              onDirectDashboard={currentSession ? () => setViewMode('app') : undefined}
              onExploreAgents={() => {
                setActiveView('agents');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateHowItWorks={() => {
                setActiveView('how_it_works');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigatePricing={() => {
                setActiveView('pricing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {activeView === 'agents' && (
            <AgentsHubPage
              onSelectTemplate={() => handleOpenAuth('register')}
            />
          )}

          {activeView === 'how_it_works' && (
            <HowItWorksPage
              onStartNow={() => handleOpenAuth('register')}
            />
          )}

          {activeView === 'pricing' && (
            <PricingSection
              onSelectPlan={(plan) => handleOpenAuth('register')}
            />
          )}
        </div>
      </main>

      <Footer
        onOpenLegal={(doc) => {
          setActiveLegalDoc(doc);
          setIsLegalOpen(true);
        }}
        onNavigate={setActiveView}
        onOpenAuth={handleOpenAuth}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialTab={authInitialTab}
      />

      {showPublicWizard && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <CreateAgentWizard
            initialCompany={activeCompany}
            onCancel={() => setShowPublicWizard(false)}
            onComplete={(agent, updatedComp) => {
              const newComp: CompanyProfile = {
                ...activeCompany,
                name: updatedComp?.name || activeCompany.name,
                agentName: agent.name,
                phone: agent.whatsappNumber || activeCompany.phone,
                ...updatedComp
              };
              setActiveCompany(newComp);
              const session: AuthSession = {
                role: 'company_admin',
                userEmail: newComp.email || 'admin@smgflow.pro',
                userName: newComp.personalContactName || newComp.name,
                companyId: newComp.id,
                companyName: newComp.name
              };
              setCurrentSession(session);
              setShowPublicWizard(false);
            }}
          />
        </div>
      )}

      <LegalModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialDoc={activeLegalDoc}
      />

      <CookieBanner
        onOpenLegal={(doc) => {
          setActiveLegalDoc(doc);
          setIsLegalOpen(true);
        }}
      />
      </div>
    </LocaleProvider>
  );
};

export default App;
