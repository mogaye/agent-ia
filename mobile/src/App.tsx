import React, { useState, useEffect } from 'react';
import { MobileTab, MobileStats } from './types';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileHomeView } from './components/MobileHomeView';
import { MobileWhatsAppView } from './components/MobileWhatsAppView';
import { MobileAIAgentView } from './components/MobileAIAgentView';
import { MobileWalletView } from './components/MobileWalletView';
import { MobileSettingsView } from './components/MobileSettingsView';
import { RechargeBottomSheet } from './components/RechargeBottomSheet';

export const MobileApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<MobileTab>('home');
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const [stats, setStats] = useState<MobileStats>({
    creditsRemaining: 0,
    monthlyLimit: 0,
    messagesSentToday: 0,
    whatsappStatus: 'qr_ready',
    connectedPhone: null,
    agentName: 'Agent IA',
    autoPilotEnabled: true,
    responseLatencySeconds: 0
  });

  // Fetch live WhatsApp status from backend if available
  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/company/whatsapp-status');
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({
          ...prev,
          whatsappStatus: data.connected ? 'connected' : (data.status || 'qr_ready'),
          connectedPhone: data.phoneNumber || null,
          responseLatencySeconds: data.responseLatencySeconds || 0
        }));
      }

      // Also check QR endpoint if super_admin / company token available
      const qrRes = await fetch('/api/whatsapp/status');
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        if (qrData.qrDataUrl) {
          setQrDataUrl(qrData.qrDataUrl);
        }
        if (qrData.status === 'connected') {
          setStats(prev => ({ ...prev, whatsappStatus: 'connected', connectedPhone: qrData.phoneNumber }));
        }
      }
    } catch (_) {
      // Offline or standalone fallback
    }
  };

  useEffect(() => {
    fetchWhatsAppStatus();
    const interval = setInterval(fetchWhatsAppStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshQr = async () => {
    setIsRefreshingQr(true);
    try {
      await fetch('/api/whatsapp/reset', { method: 'POST' });
      for (let i = 0; i < 4; i++) {
        await new Promise(r => setTimeout(r, 900));
        await fetchWhatsAppStatus();
      }
    } catch (_) {}
    setIsRefreshingQr(false);
  };

  const handleConfirmRecharge = (credits: number) => {
    setStats(prev => ({
      ...prev,
      creditsRemaining: prev.creditsRemaining + credits
    }));
  };

  const handleToggleAutopilot = () => {
    setStats(prev => ({
      ...prev,
      autoPilotEnabled: !prev.autoPilotEnabled
    }));
  };

  const handleUpdateLatency = async (seconds: number) => {
    setStats(prev => ({ ...prev, responseLatencySeconds: seconds }));
    try {
      await fetch('/api/whatsapp/latency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds })
      });
    } catch (_) {}
  };

  const handleDownloadZip = () => {
    window.location.href = '/api/download/mobile-zip';
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#070E1A] text-slate-100 font-sans overflow-x-hidden">
      {/* Top Mobile Bar */}
      <MobileHeader
        stats={stats}
        onOpenRecharge={() => setIsRechargeOpen(true)}
        onOpenWhatsApp={() => setCurrentTab('whatsapp')}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'home' && (
          <MobileHomeView
            stats={stats}
            onNavigate={(t) => setCurrentTab(t)}
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onToggleAutopilot={handleToggleAutopilot}
            onDownloadZip={handleDownloadZip}
          />
        )}

        {currentTab === 'whatsapp' && (
          <MobileWhatsAppView
            stats={stats}
            qrDataUrl={qrDataUrl}
            onRefreshQr={handleRefreshQr}
            isRefreshingQr={isRefreshingQr}
            onUpdateLatency={handleUpdateLatency}
          />
        )}

        {currentTab === 'ai_agent' && (
          <MobileAIAgentView />
        )}

        {currentTab === 'wallet' && (
          <MobileWalletView
            creditsRemaining={stats.creditsRemaining}
            onOpenRecharge={() => setIsRechargeOpen(true)}
          />
        )}

        {currentTab === 'settings' && (
          <MobileSettingsView
            stats={stats}
            onDownloadZip={handleDownloadZip}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Tab Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onChangeTab={(t) => setCurrentTab(t)}
        whatsappStatus={stats.whatsappStatus}
      />

      {/* Native Slide-up Bottom Sheet for Instant Mobile Recharge */}
      <RechargeBottomSheet
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        onConfirmRecharge={handleConfirmRecharge}
      />
    </div>
  );
};

export default MobileApp;
