import React from 'react';
import { LayoutGrid, MessageSquare, Bot, Wallet, Settings } from 'lucide-react';
import { MobileTab } from '../types';

interface MobileBottomNavProps {
  currentTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  whatsappStatus: 'connected' | 'qr_ready' | 'connecting' | 'disconnected';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onChangeTab,
  whatsappStatus
}) => {
  const tabs = [
    { id: 'home' as MobileTab, label: 'Accueil', icon: LayoutGrid },
    {
      id: 'whatsapp' as MobileTab,
      label: 'WhatsApp',
      icon: MessageSquare,
      badge: whatsappStatus !== 'connected' ? '!' : undefined
    },
    { id: 'ai_agent' as MobileTab, label: 'Agent IA', icon: Bot },
    { id: 'wallet' as MobileTab, label: 'Solde', icon: Wallet },
    { id: 'settings' as MobileTab, label: 'Réglages', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#070E1A]/95 backdrop-blur-2xl border-t border-white/10 pb-safe shadow-2xl">
      <div className="grid grid-cols-5 items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 relative active:scale-90 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Tab Glow Pill */}
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-[#070E1A] text-[9px] font-black flex items-center justify-center animate-bounce">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate ${isActive ? 'text-emerald-300' : 'text-slate-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
