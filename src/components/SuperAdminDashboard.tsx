import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Bot, 
  CreditCard, 
  Layers, 
  Activity, 
  MessageSquare, 
  Wrench, 
  LifeBuoy, 
  Server, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Pause, 
  Play, 
  Cpu,
  ArrowUpRight,
  Sparkles,
  X,
  Phone,
  Clock,
  FileText,
  ShoppingBag,
  Calendar as CalendarIcon,
  Users,
  Database,
  Lock,
  QrCode,
  Smartphone,
  RefreshCw,
  Send,
  Loader2,
  Check,
  Zap,
  Package,
  Menu
} from 'lucide-react';
import { 
  DEFAULT_COMPANY, 
  MOCK_MODULES, 
  MOCK_INSTRUCTIONS 
} from '../data/mockData';
import { CompanyProfile } from '../types';
import { accountStorage } from '../lib/accountStorage';
import { supabaseService } from '../lib/supabase';
import { api } from '../lib/api.ts';

interface SuperAdminDashboardProps {
  onBackToLanding: () => void;
  onSelectCompanyForDashboard?: (company: CompanyProfile) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onBackToLanding,
  onSelectCompanyForDashboard
}) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [allAgents, setAllAgents] = useState<any[]>([]);
  const [globalOrders, setGlobalOrders] = useState<any[]>([]);
  const [globalReservations, setGlobalReservations] = useState<any[]>([]);
  const [globalProducts, setGlobalProducts] = useState<any[]>([]);
  const [globalInvoices, setGlobalInvoices] = useState<any[]>([]);
  const [globalCustomers, setGlobalCustomers] = useState<any[]>([]);
  const [globalModules, setGlobalModules] = useState<any[]>(MOCK_MODULES);
  const [aiStatusInfo, setAiStatusInfo] = useState<any>(null);
  const [serverMetrics, setServerMetrics] = useState<any>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const [adminTab, setAdminTab] = useState<string>('whatsapp_gateway');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [opsFilterTab, setOpsFilterTab] = useState<'logs' | 'orders' | 'reservations' | 'products' | 'customers'>('logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  // WhatsApp Central Provider Gateway State
  const [qrStatus, setQrStatus] = useState<'disconnected' | 'connecting' | 'qr_ready' | 'connected'>('disconnected');
  const [liveQrImage, setLiveQrImage] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<string | null>(null);
  const [responseLatency, setResponseLatency] = useState<number>(0);
  const [isFetchingQr, setIsFetchingQr] = useState<boolean>(false);
  const [isResettingSession, setIsResettingSession] = useState<boolean>(false);
  const [isUpdatingLatency, setIsUpdatingLatency] = useState<boolean>(false);
  const [latencySavedMessage, setLatencySavedMessage] = useState<string | null>(null);

  // OTP Dispatcher State
  const [otpPhoneNumber, setOtpPhoneNumber] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [otpResult, setOtpResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
    sentViaWhatsApp?: boolean;
    directUrl?: string;
    reason?: string;
  } | null>(null);

  // Logs State
  const [whatsappLogs, setWhatsappLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  // PayDunya & Direct Payment State
  const [directWavePhone, setDirectWavePhone] = useState('');
  const [directOmPhone, setDirectOmPhone] = useState('');
  const [paydunyaMasterKey, setPaydunyaMasterKey] = useState('');
  const [paydunyaPublicKey, setPaydunyaPublicKey] = useState('');
  const [paydunyaPrivateKey, setPaydunyaPrivateKey] = useState('');
  const [paydunyaToken, setPaydunyaToken] = useState('');
  const [paydunyaMode, setPaydunyaMode] = useState<'test' | 'live'>('live');
  const [paydunyaConfig, setPaydunyaConfig] = useState<any>(null);
  const [paydunyaTransactions, setPaydunyaTransactions] = useState<any[]>([]);
  const [isLoadingPaydunya, setIsLoadingPaydunya] = useState(false);
  const [isSavingPaydunya, setIsSavingPaydunya] = useState(false);
  const [paydunyaSaveNotice, setPaydunyaSaveNotice] = useState<string | null>(null);

  // Synchronisation Bidirectionnelle : pousse les données locales (accountStorage) vers le serveur puis récupère l'état unifié
  const synchronizeAllPlatformData = async (manual = false) => {
    try {
      if (manual) setIsSyncingAll(true);
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Si des données existent dans accountStorage local, les synchroniser avec le serveur pour qu'aucune modification locale ne manque
      const localAccounts = await accountStorage.getAllRegisteredAccounts().catch(() => []);
      const candidateIds = Array.from(new Set([
        'c-mgaye60000',
        'c-smgflow-default',
        DEFAULT_COMPANY.id,
        ...localAccounts.map(a => a.id)
      ]));

      for (const cid of candidateIds) {
        const localData = accountStorage.getCompanyData(cid);
        if (localData && (localData.products || localData.orders || localData.reservations || localData.agentsList)) {
          await fetch('/api/company/sync', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              companyId: cid,
              ...localData
            })
          }).catch(() => {});
        }
      }

      // 2. Récupérer l'état maître synchronisé depuis /api/admin/sync
      const res = await fetch('/api/admin/sync', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.companies)) {
            const mergedCompanies = data.companies.map((c: any) => {
              const local = accountStorage.getCompanyData(c.id);
              const products = (Array.isArray(c.products) && c.products.length > 0) ? c.products : (local?.products || []);
              const orders = (Array.isArray(c.orders) && c.orders.length > 0) ? c.orders : (local?.orders || []);
              const reservations = (Array.isArray(c.reservations) && c.reservations.length > 0) ? c.reservations : (local?.reservations || []);
              const customers = (Array.isArray(c.customers) && c.customers.length > 0) ? c.customers : (local?.customers || []);
              const invoices = (Array.isArray(c.invoices) && c.invoices.length > 0) ? c.invoices : (local?.invoices || []);
              const modules = (Array.isArray(c.modules) && c.modules.length > 0) ? c.modules : (local?.modules || MOCK_MODULES);
              const instructionsList = (Array.isArray(c.instructionsList) && c.instructionsList.length > 0) ? c.instructionsList : (local?.instructions || []);
              const revenueXOF = orders.reduce((acc: number, o: any) => acc + (Number(o.totalAmount) || 0), 0);

              return {
                ...c,
                products,
                orders,
                reservations,
                customers,
                invoices,
                modules,
                instructionsList,
                ordersCount: orders.length,
                appointmentsCount: reservations.length + (c.calendarSlots?.length || 0),
                productsCount: products.length,
                customersCount: customers.length,
                revenueXOF
              };
            });

            setCompanies(mergedCompanies);

            setSelectedCompany((prev: any) => {
              if (!prev) return null;
              return mergedCompanies.find((mc: any) => mc.id === prev.id) || prev;
            });

            const aggOrders: any[] = [];
            const aggReservations: any[] = [];
            const aggProducts: any[] = [];
            const aggInvoices: any[] = [];
            const aggCustomers: any[] = [];

            mergedCompanies.forEach((mc: any) => {
              (mc.orders || []).forEach((o: any) => aggOrders.push({ ...o, companyName: mc.name, companyId: mc.id }));
              (mc.reservations || []).forEach((r: any) => aggReservations.push({ ...r, companyName: mc.name, companyId: mc.id }));
              (mc.products || []).forEach((p: any) => aggProducts.push({ ...p, companyName: mc.name, companyId: mc.id }));
              (mc.invoices || []).forEach((i: any) => aggInvoices.push({ ...i, companyName: mc.name, companyId: mc.id }));
              (mc.customers || []).forEach((cu: any) => aggCustomers.push({ ...cu, companyName: mc.name, companyId: mc.id }));
            });

            setGlobalOrders(aggOrders);
            setGlobalReservations(aggReservations);
            setGlobalProducts(aggProducts);
            setGlobalInvoices(aggInvoices);
            setGlobalCustomers(aggCustomers);
            if (mergedCompanies[0]?.modules?.length > 0) setGlobalModules(mergedCompanies[0].modules);
          }

          if (Array.isArray(data.agents)) {
            setAllAgents(data.agents);
          }
          if (Array.isArray(data.whatsappLogs)) {
            setWhatsappLogs(data.whatsappLogs);
          }
          if (Array.isArray(data.transactions)) {
            setPaydunyaTransactions(data.transactions);
          }
          if (data.aiStatus) {
            setAiStatusInfo(data.aiStatus);
          }
          if (data.serverMetrics) {
            setServerMetrics(data.serverMetrics);
          }
          if (data.adminWhatsApp) {
            const wa = data.adminWhatsApp;
            if (wa.status === 'connected') {
              setQrStatus('connected');
              setConnectedPhone(wa.phoneNumber || 'Passerelle Admin Connectée');
              setConnectedAt(wa.connectedAt);
            } else {
              setQrStatus(wa.status || 'qr_ready');
              if (wa.qrDataUrl) setLiveQrImage(wa.qrDataUrl);
            }
            if (wa.responseLatencySeconds !== undefined) {
              setResponseLatency(wa.responseLatencySeconds);
            }
          }
        }
      }

      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (manual) {
        setSyncNotice('Synchronisation globale terminée : Entreprises, Agents IA, Stocks, Commandes, Réservations et WhatsApp sont à jour !');
        setTimeout(() => setSyncNotice(null), 4000);
      }
    } catch (e) {
      console.warn('Global Admin Sync error:', e);
    } finally {
      if (manual) setIsSyncingAll(false);
    }
  };

  const fetchPaydunyaData = async () => {
    try {
      setIsLoadingPaydunya(true);
      const token = api.getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [cfgRes, txRes] = await Promise.all([
        fetch('/api/paydunya/config', { headers }),
        fetch('/api/payments/transactions', { headers })
      ]);
      if (cfgRes.ok) {
        const c = await cfgRes.json();
        setPaydunyaConfig(c.config);
        if (c.config?.mode) setPaydunyaMode(c.config.mode);
        if (c.config?.directWavePhone) setDirectWavePhone(c.config.directWavePhone);
        if (c.config?.directOmPhone) setDirectOmPhone(c.config.directOmPhone);
      }
      if (txRes.ok) {
        const t = await txRes.json();
        if (t.transactions) setPaydunyaTransactions(t.transactions);
      }
    } catch (e) {
      console.warn('PayDunya fetch error:', e);
    } finally {
      setIsLoadingPaydunya(false);
    }
  };

  const handleSavePaydunyaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingPaydunya(true);
      setPaydunyaSaveNotice(null);
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/paydunya/config', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          masterKey: paydunyaMasterKey || paydunyaConfig?.masterKey,
          publicKey: paydunyaPublicKey || paydunyaConfig?.publicKey,
          privateKey: paydunyaPrivateKey,
          token: paydunyaToken || paydunyaConfig?.token,
          mode: paydunyaMode,
          directWavePhone,
          directOmPhone
        })
      });
      if (res.ok) {
        setPaydunyaSaveNotice('Configuration PayDunya enregistrée avec succès !');
        setPaydunyaMasterKey('');
        setPaydunyaPublicKey('');
        setPaydunyaPrivateKey('');
        setPaydunyaToken('');
        await fetchPaydunyaData();
        setTimeout(() => setPaydunyaSaveNotice(null), 4000);
      }
    } catch (e) {
      setPaydunyaSaveNotice('Erreur lors de la sauvegarde PayDunya.');
    } finally {
      setIsSavingPaydunya(false);
    }
  };

  const fetchLiveWhatsAppStatus = async () => {
    try {
      setIsFetchingQr(true);
      const token = api.getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/whatsapp/status?role=admin_otp', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'connected') {
          setQrStatus('connected');
          setConnectedPhone(data.phoneNumber || 'Passerelle Admin Connectée');
          setConnectedAt(data.connectedAt);
        } else {
          setQrStatus(data.status || 'qr_ready');
          if (data.qrDataUrl) {
            setLiveQrImage(data.qrDataUrl);
          }
        }
        if (data.responseLatencySeconds !== undefined) {
          setResponseLatency(data.responseLatencySeconds);
        }
      }
    } catch (e) {
      console.warn('SuperAdmin WhatsApp status poll error:', e);
    } finally {
      setIsFetchingQr(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await supabaseService.getWhatsAppLogs(50);
      setWhatsappLogs(logs);
    } catch (e) {
      console.warn('Fetch logs error:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    synchronizeAllPlatformData(false);
    fetchLiveWhatsAppStatus();
    fetchPaydunyaData();
    const interval = setInterval(() => {
      synchronizeAllPlatformData(false);
      fetchLiveWhatsAppStatus();
    }, 2500);
    return () => clearInterval(interval);
  }, [adminTab]);

  const handleResetSession = async () => {
    try {
      setIsResettingSession(true);
      setLiveQrImage(null);
      setQrStatus('qr_ready');
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/whatsapp/reset', {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: 'admin_otp' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.qrDataUrl) {
          setLiveQrImage(data.qrDataUrl);
          setQrStatus('qr_ready');
        }
      }
      await fetchLiveWhatsAppStatus();
    } catch (e) {
      console.error('Error resetting WhatsApp session:', e);
    } finally {
      setIsResettingSession(false);
    }
  };

  const handleResetAgentWhatsApp = async (companyId: string, agentId: string) => {
    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/whatsapp/reset', {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: 'company_agent', companyId, agentId })
      });
      await synchronizeAllPlatformData(true);
    } catch (e) {
      console.error('Error resetting agent session:', e);
    }
  };

  const handleUpdateLatency = async (seconds: number) => {
    try {
      setIsUpdatingLatency(true);
      setResponseLatency(seconds);
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/whatsapp/latency', {
        method: 'POST',
        headers,
        body: JSON.stringify({ seconds })
      });
      if (res.ok) {
        setLatencySavedMessage(`Latence fixée à ${seconds}s (synchronisée)`);
        setTimeout(() => setLatencySavedMessage(null), 3500);
      }
    } catch (e) {
      console.error('Error updating latency:', e);
    } finally {
      setIsUpdatingLatency(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpPhoneNumber.trim()) return;
    setIsSendingOtp(true);
    setOtpResult(null);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: otpPhoneNumber.trim(), type: 'whatsapp' })
      });
      const data = await res.json();
      setOtpResult({
        success: data.success,
        message: data.message || (data.sentViaWhatsApp ? 'Code envoyé avec succès sur WhatsApp !' : 'Code généré'),
        code: data.code,
        sentViaWhatsApp: data.sentViaWhatsApp,
        directUrl: data.directWhatsAppUrl,
        reason: data.whatsappReason
      });
      fetchLogs();
    } catch (err: any) {
      setOtpResult({
        success: false,
        message: err?.message || 'Erreur lors de l\'envoi du code OTP.'
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Synchroniser le statut Actif / Pause d'une entreprise avec le serveur ET le Dashboard Entreprise
  const toggleAgentStatus = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = companies.find(c => c.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'paused' : 'active';

    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
    if (selectedCompany?.id === id) {
      setSelectedCompany((prev: any) => prev ? { ...prev, status: nextStatus } : null);
    }

    // Mettre à jour dans accountStorage pour synchronisation immédiate côté client
    const saved = accountStorage.getCompanyData(id);
    if (saved) {
      accountStorage.saveCompanyData(id, {
        ...saved,
        company: { ...(saved.company || target), status: nextStatus }
      });
    }

    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/admin/companies/${encodeURIComponent(id)}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: nextStatus })
      });
      await synchronizeAllPlatformData(false);
    } catch (err) {
      console.warn('Toggle status sync error:', err);
    }
  };

  // Synchroniser l'activation / désactivation d'un module avec le Dashboard Entreprise
  const handleToggleGlobalModule = async (moduleId: string) => {
    const nextModules = globalModules.map(m => m.id === moduleId ? { ...m, enabled: !m.enabled } : m);
    setGlobalModules(nextModules);

    const token = api.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    for (const comp of companies) {
      const saved = accountStorage.getCompanyData(comp.id);
      if (saved) {
        accountStorage.saveCompanyData(comp.id, { ...saved, modules: nextModules });
      }
      await fetch(`/api/admin/companies/${encodeURIComponent(comp.id)}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ modules: nextModules })
      }).catch(() => {});
    }
    setSyncNotice('Module synchronisé en direct avec tous les Tableaux de Bord Entreprise !');
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const totalConversations = Math.max(
    whatsappLogs.length,
    companies.reduce((acc, c) => acc + (c.conversationsCount || 0), 0)
  );

  const realMRR = paydunyaTransactions
    .filter(t => t.status === 'success')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const totalRevenueXOF = companies.reduce((acc, c) => acc + (c.revenueXOF || 0), 0);

  const adminMenuItems = [
    { 
      id: 'whatsapp_gateway', 
      label: 'Fournisseur WhatsApp (OTP)', 
      shortLabel: 'WhatsApp OTP',
      icon: Smartphone, 
      count: qrStatus === 'connected' ? 'En ligne' : 'Scan Requis',
      isHighlight: true
    },
    { id: 'entreprises', label: 'Entreprises Synchronisées', shortLabel: 'Entreprises', icon: Building2, count: companies.length },
    { id: 'agents', label: 'Agents IA & Sessions', shortLabel: 'Agents IA', icon: Bot, count: allAgents.length },
    { id: 'conversations', label: 'Opérations & Conversations', shortLabel: 'Opérations', icon: MessageSquare, count: totalConversations + globalOrders.length + globalReservations.length },
    { id: 'modules', label: 'Modules & Licences', shortLabel: 'Modules', icon: Layers, count: globalModules.filter(m => m.enabled).length },
    { id: 'utilisation', label: 'Utilisation & Tokens IA', shortLabel: 'Tokens IA', icon: Cpu },
    { id: 'abonnements', label: 'Abonnements & MRR', shortLabel: 'Abonnements', icon: CreditCard },
    { id: 'paiements', label: 'Paiements PayDunya (Wave, OM, CB)', shortLabel: 'PayDunya', icon: CreditCard, count: paydunyaTransactions.length },
    { id: 'maintenance', label: 'Maintenance Clusters', shortLabel: 'Clusters', icon: Wrench },
    { id: 'support', label: 'Support & Tickets', shortLabel: 'Support', icon: LifeBuoy, count: 0 },
    { id: 'activite', label: 'Activité Système', shortLabel: 'Système', icon: Activity },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row border-b border-slate-200 relative">
      
      {/* Clean Single-Row Mobile Top Bar (Visible only on < md) */}
      <div className="md:hidden bg-white border-b border-slate-200 shrink-0 z-30">
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-xs text-[#0A0A0A] truncate">
                  Msg<span className="text-[#0052CC]">Flow Core</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Sync Direct Active" />
              </div>
              <p className="text-[10px] text-slate-500 font-semibold truncate">
                {adminMenuItems.find((i) => i.id === adminTab)?.label || 'Super Admin'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onBackToLanding}
              className="px-2.5 py-1.5 rounded-full bg-[#F8FAFC] border border-slate-200 text-slate-700 text-[11px] font-extrabold cursor-pointer"
            >
              ← Site
            </button>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="px-3 py-1.5 rounded-full bg-[#0052CC] text-white text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              {mobileSidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
              <span>Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Super Admin Sidebar - Drawer on Mobile, Fixed on Desktop */}
      <aside className={`${
        mobileSidebarOpen ? 'fixed inset-y-0 left-0 w-72 z-50 flex shadow-2xl' : 'hidden'
      } md:static md:flex md:w-64 md:h-full bg-white border-r border-slate-200 flex-col shrink-0 z-20`}>
        
        {/* Admin Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-extrabold text-sm text-[#0A0A0A]">
                Msg<span className="text-[#0052CC]">Flow Core</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium">Super Admin Console</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-[#EBF2FF] text-[#0052CC] font-mono text-[9px] font-bold">
              ROOT SYNC
            </span>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Sync Status Badge in Sidebar */}
        <div className="px-4 py-2.5 bg-emerald-50/70 border-b border-emerald-200/70 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sync Direct Active
          </span>
          <span className="font-mono text-[10px] text-emerald-700 font-semibold">{lastSyncTime}</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = adminTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setAdminTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0052CC] text-white shadow-xs'
                    : item.isHighlight && qrStatus !== 'connected'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.isHighlight ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : item.isHighlight && qrStatus === 'connected'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.isHighlight
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Back to Platform */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={onBackToLanding}
            className="w-full py-2.5 px-3 rounded-xl neu-btn text-slate-700 text-xs font-bold transition-all text-center cursor-pointer"
          >
            ← Retour à la plateforme
          </button>
        </div>

      </aside>

      {/* Main Super Admin Content - Seule cette partie défile verticalement */}
      <main className="flex-1 md:h-full min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-4 sm:space-y-6">
        
        {/* Structured Admin Header & Control Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-white shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 font-display">
                  Console d'Administration Plateforme
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[10px] font-mono font-bold">
                  Sync Temps Réel 2.5s
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                Supervision synchronisée : Entreprises, Agents IA, Catalogue, Commandes, RDV et Passerelle WhatsApp.
              </p>
            </div>
          </div>

          {/* Symmetrical 2x2 / 4-Column Quick Action & Status Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => synchronizeAllPlatformData(true)}
              disabled={isSyncingAll}
              className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-left flex items-center gap-2.5 cursor-pointer transition-all"
              title="Forcer la synchronisation immédiate"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-700 shrink-0">
                <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Synchronisation</span>
                <span className="text-xs font-extrabold text-emerald-950 truncate block">
                  {isSyncingAll ? 'En cours...' : `Actif (${lastSyncTime})`}
                </span>
              </div>
            </button>

            {onSelectCompanyForDashboard && (
              <button
                type="button"
                onClick={() => onSelectCompanyForDashboard(companies[0] || DEFAULT_COMPANY)}
                className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl neu-btn-primary text-white text-left flex items-center gap-2.5 cursor-pointer shadow-xs transition-all"
                title="Ouvrir le Tableau de Bord Entreprise"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-sky-100 uppercase block">Espace Entreprise</span>
                  <span className="text-xs font-extrabold text-white truncate block">Dashboard Agents IA</span>
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={() => setAdminTab('whatsapp_gateway')}
              className={`p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer border ${
                qrStatus === 'connected'
                  ? 'bg-emerald-50/60 text-emerald-900 border-emerald-300'
                  : 'bg-amber-50/80 text-amber-900 border-amber-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                qrStatus === 'connected' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'
              }`}>
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase block opacity-75">OTP WhatsApp</span>
                  <span className={`w-2 h-2 rounded-full ${qrStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
                </div>
                <span className="text-xs font-extrabold truncate block">
                  {qrStatus === 'connected' ? connectedPhone : 'Scanner QR'}
                </span>
              </div>
            </button>

            <div className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-700 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">CA Synchronisé</span>
                <span className="text-xs font-extrabold font-mono text-emerald-700 truncate block">
                  {totalRevenueXOF.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* GLOBAL REAL-TIME KPI SUMMARY BAR (Compact 3x2 on mobile, 6 cols on desktop) */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-slate-200/60">
            <div onClick={() => setAdminTab('entreprises')} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 cursor-pointer hover:border-sky-300 transition">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate block">Entreprises</span>
              <div className="flex items-baseline justify-between gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-extrabold font-mono text-slate-900">{companies.length}</span>
                <span className="text-[9px] text-emerald-700 font-bold truncate">{companies.filter(c => c.status === 'active').length} act.</span>
              </div>
            </div>
            <div onClick={() => setAdminTab('agents')} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 cursor-pointer hover:border-sky-300 transition">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate block">Agents IA</span>
              <div className="flex items-baseline justify-between gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-extrabold font-mono text-sky-700">{allAgents.length}</span>
                <span className="text-[9px] text-emerald-700 font-bold truncate">
                  {allAgents.filter(a => a.whatsappStatus === 'connected').length} WA
                </span>
              </div>
            </div>
            <div onClick={() => { setAdminTab('conversations'); setOpsFilterTab('products'); }} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 cursor-pointer hover:border-sky-300 transition">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate block">Catalogue</span>
              <div className="flex items-baseline justify-between gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-extrabold font-mono text-indigo-700">{globalProducts.length}</span>
                <span className="text-[9px] text-slate-500 font-medium truncate">articles</span>
              </div>
            </div>
            <div onClick={() => { setAdminTab('conversations'); setOpsFilterTab('orders'); }} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 cursor-pointer hover:border-sky-300 transition">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate block">Commandes</span>
              <div className="flex items-baseline justify-between gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-700">{globalOrders.length}</span>
                <span className="text-[9px] text-emerald-800 font-bold truncate">ventes</span>
              </div>
            </div>
            <div onClick={() => { setAdminTab('conversations'); setOpsFilterTab('reservations'); }} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 cursor-pointer hover:border-sky-300 transition">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate block">Agenda RDV</span>
              <div className="flex items-baseline justify-between gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-extrabold font-mono text-amber-700">{globalReservations.length}</span>
                <span className="text-[9px] text-slate-500 font-medium truncate">RDV</span>
              </div>
            </div>
            <div onClick={() => { setAdminTab('conversations'); setOpsFilterTab('customers'); }} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 cursor-pointer hover:border-sky-300 transition">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase truncate block">Clients CRM</span>
              <div className="flex items-baseline justify-between gap-1 mt-0.5">
                <span className="text-sm sm:text-base font-extrabold font-mono text-slate-900">{globalCustomers.length}</span>
                <span className="text-[9px] text-sky-700 font-bold truncate">{totalConversations} msg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Sync Toast Notice */}
        {syncNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncNotice}</span>
            </div>
            <button onClick={() => setSyncNotice(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB: ENTREPRISES SYNCHRONISÉES */}
        {adminTab === 'entreprises' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une entreprise, un agent ou secteur..."
                  className="w-full neu-input rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span>{companies.length} entreprises synchronisées</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">
                  Cliquez sur une entreprise pour inspecter toutes ses données en direct
                </span>
              </div>
            </div>

            <div className="neu-flat rounded-2xl border border-white/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="neu-pressed border-b border-[#D1D9E6] text-slate-600 font-mono text-[11px] font-bold">
                    <tr>
                      <th className="p-4">Entreprise & Secteur</th>
                      <th className="p-4">Agents IA</th>
                      <th className="p-4">Catalogue & CRM</th>
                      <th className="p-4">Opérations (Cmd / RDV)</th>
                      <th className="p-4">CA Synchronisé</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4">Forfait</th>
                      <th className="p-4 text-right">Pilotage Direct</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D1D9E6]/60">
                    {companies
                      .filter(comp => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return comp.name?.toLowerCase().includes(q) || 
                               comp.agentName?.toLowerCase().includes(q) || 
                               comp.industry?.toLowerCase().includes(q);
                      })
                      .map((comp) => (
                      <tr 
                        key={comp.id} 
                        onClick={() => setSelectedCompany(comp)}
                        className="hover:bg-white/60 transition-colors cursor-pointer group"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl neu-pressed flex items-center justify-center text-sky-700 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{comp.name}</span>
                              <span className="text-[10px] text-slate-500">{comp.industry || 'Non renseigné'} • {comp.phone || 'Non renseigné'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Bot className="w-3.5 h-3.5 text-sky-600" />
                            <span>{comp.agentName || 'Aucun agent'}</span>
                            {Array.isArray(comp.agentsList) && comp.agentsList.length > 1 && (
                              <span className="px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono text-[10px]">
                                +{comp.agentsList.length - 1}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-700 font-mono block">
                            {comp.whatsappConnectedCount || 0} connecté(s) WhatsApp
                          </span>
                        </td>

                        <td className="p-4 font-mono text-[11px] text-slate-700">
                          <span className="font-bold text-indigo-800">{comp.productsCount || comp.products?.length || 0} prod.</span>
                          {' • '}
                          <span>{comp.customersCount || comp.customers?.length || 0} clients</span>
                        </td>

                        <td className="p-4">
                          <span className="text-slate-700 font-mono text-[11px] font-bold">
                            {comp.ordersCount || 0} cmd • {comp.appointmentsCount || 0} RDV
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {comp.conversationsCount || 0} messages IA
                          </span>
                        </td>

                        <td className="p-4 font-mono font-extrabold text-emerald-700">
                          {(comp.revenueXOF || 0).toLocaleString()} FCFA
                        </td>

                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1 ${
                            comp.status === 'active' ? 'neu-pill text-emerald-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${comp.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {comp.status === 'active' ? 'Actif' : 'En pause'}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="neu-pill px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 uppercase">
                            {comp.plan || 'PRO'}
                          </span>
                        </td>

                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCompany(comp);
                            }}
                            className="px-2.5 py-1.5 rounded-xl neu-btn text-sky-700 hover:text-sky-900 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Inspecter</span>
                          </button>
                          {onSelectCompanyForDashboard && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCompanyForDashboard(comp);
                              }}
                              className="px-2.5 py-1.5 rounded-xl neu-btn text-emerald-700 hover:text-emerald-900 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Ouvrir le Tableau de bord de cette entreprise"
                            >
                              <span>Dashboard</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => toggleAgentStatus(comp.id, e)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              comp.status === 'active' ? 'neu-btn text-amber-800' : 'neu-btn-primary text-white'
                            }`}
                          >
                            {comp.status === 'active' ? 'Pause' : 'Activer'}
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AGENTS IA & SESSIONS WHATSAPP SYNCHRONISÉES */}
        {adminTab === 'agents' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl neu-flat border border-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-sky-600" />
                  <span>Tous les Agents IA Synchronisés ({allAgents.length})</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Vue temps réel de chaque agent IA configuré dans les Tableaux de Bord Entreprise, son rôle, sa base de connaissances et sa session WhatsApp Baileys.
                </p>
              </div>
              {onSelectCompanyForDashboard && (
                <button
                  onClick={() => onSelectCompanyForDashboard(companies[0] || DEFAULT_COMPANY)}
                  className="px-4 py-2.5 rounded-2xl neu-btn-primary text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Bot className="w-4 h-4" />
                  <span>Gérer / Créer un Agent dans le Dashboard</span>
                </button>
              )}
            </div>

            {allAgents.length === 0 ? (
              <div className="p-8 rounded-3xl neu-pressed text-center text-xs text-slate-500 font-medium">
                Aucun agent IA créé pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {allAgents.map((ag) => (
                  <div key={`${ag.companyId}-${ag.id}`} className="p-5 rounded-3xl neu-flat border border-white/80 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl neu-pressed flex items-center justify-center text-sky-700 font-extrabold text-sm">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900">{ag.name}</h3>
                            <span className="text-[11px] font-bold text-sky-700 block">{ag.roleTitle}</span>
                            <span className="text-[10px] text-slate-400 font-medium block">{ag.companyName}</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          ag.whatsappStatus === 'connected'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {ag.whatsappStatus === 'connected' ? '● WhatsApp Connecté' : '○ Prêt au scan'}
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl neu-pressed space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Numéro WhatsApp :</span>
                          <span className="font-mono font-bold text-slate-800">{ag.whatsappNumber || 'Non lié'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Connaissances Dashboard :</span>
                          <span className="font-mono font-bold text-emerald-700">{(ag.knowledgeLength || 0).toLocaleString()} caract.</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Documents & Règles :</span>
                          <span className="font-mono font-bold text-slate-800">{ag.documentsCount || 0} docs • {ag.rulesCount || 0} règles</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {onSelectCompanyForDashboard && (
                        <button
                          onClick={() => {
                            const comp = companies.find(c => c.id === ag.companyId) || companies[0] || DEFAULT_COMPANY;
                            onSelectCompanyForDashboard(comp);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl neu-btn-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Configurer / Scanner QR</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleResetAgentWhatsApp(ag.companyId, ag.id)}
                        className="py-2 px-3 rounded-xl neu-btn text-slate-700 hover:text-rose-700 text-xs font-bold cursor-pointer"
                        title="Réinitialiser la session WhatsApp de cet agent"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: OPÉRATIONS & CONVERSATIONS GLOBALES SYNCHRONISÉES */}
        {adminTab === 'conversations' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl neu-flat border border-white/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-sky-600" />
                    <span>Centre des Opérations & Conversations Synchronisées</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Toutes les données ajoutées ou modifiées dans les Tableaux de Bord Entreprise apparaissent ici en direct.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'logs', label: `Messages WhatsApp (${whatsappLogs.length})` },
                    { id: 'orders', label: `Commandes (${globalOrders.length})` },
                    { id: 'reservations', label: `Réservations (${globalReservations.length})` },
                    { id: 'products', label: `Catalogue & Stocks (${globalProducts.length})` },
                    { id: 'customers', label: `Clients CRM (${globalCustomers.length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setOpsFilterTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        opsFilterTab === tab.id ? 'neu-btn-primary text-white' : 'neu-btn text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SUB-VIEW: LOGS WHATSAPP */}
              {opsFilterTab === 'logs' && (
                whatsappLogs.length === 0 ? (
                  <div className="p-6 rounded-2xl neu-pressed text-center text-xs text-slate-500 font-medium">
                    Aucun échange WhatsApp enregistré pour le moment.
                  </div>
                ) : (
                  <div className="neu-pressed rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#DFE5ED] text-slate-600 font-mono text-[10px] font-bold border-b border-[#D1D9E6]">
                        <tr>
                          <th className="p-3">Numéro / Client</th>
                          <th className="p-3">Message Client</th>
                          <th className="p-3">Réponse IA Synchronisée</th>
                          <th className="p-3 text-right">Horodatage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1D9E6]/60">
                        {whatsappLogs.map((log: any, idx: number) => (
                          <tr key={log.id || idx} className="hover:bg-white/40">
                            <td className="p-3 font-mono font-bold text-emerald-800">{log.phone_number || log.sender || '—'}</td>
                            <td className="p-3 text-slate-700 max-w-xs truncate">{log.incoming_message || log.messageBody || log.message || '—'}</td>
                            <td className="p-3 text-slate-900 font-medium max-w-md truncate">{log.reply_message || log.aiResponse || log.reply || '—'}</td>
                            <td className="p-3 text-right font-mono text-[11px] text-slate-500">
                              {(log.created_at || log.timestamp) ? new Date(log.created_at || log.timestamp).toLocaleTimeString() : 'En direct'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {/* SUB-VIEW: COMMANDES SYNCHRONISÉES */}
              {opsFilterTab === 'orders' && (
                <div className="neu-pressed rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#DFE5ED] text-slate-600 font-mono text-[10px] font-bold border-b border-[#D1D9E6]">
                      <tr>
                        <th className="p-3">Réf. Commande</th>
                        <th className="p-3">Entreprise</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Articles</th>
                        <th className="p-3">Montant Total</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1D9E6]/60">
                      {globalOrders.map((o: any, idx: number) => (
                        <tr key={o.id || idx} className="hover:bg-white/40">
                          <td className="p-3 font-mono font-bold text-slate-900">{o.id}</td>
                          <td className="p-3 text-sky-800 font-bold">{o.companyName || companies[0]?.name}</td>
                          <td className="p-3 font-bold text-slate-800">{o.customerName}</td>
                          <td className="p-3 text-slate-600">{Array.isArray(o.items) ? o.items.join(', ') : o.items}</td>
                          <td className="p-3 font-mono font-extrabold text-emerald-700">{(o.totalAmount || 0).toLocaleString()} FCFA</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-VIEW: RÉSERVATIONS SYNCHRONISÉES */}
              {opsFilterTab === 'reservations' && (
                <div className="neu-pressed rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#DFE5ED] text-slate-600 font-mono text-[10px] font-bold border-b border-[#D1D9E6]">
                      <tr>
                        <th className="p-3">Réf. Réservation</th>
                        <th className="p-3">Entreprise</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Date & Heure</th>
                        <th className="p-3">Convives</th>
                        <th className="p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1D9E6]/60">
                      {globalReservations.map((r: any, idx: number) => (
                        <tr key={r.id || idx} className="hover:bg-white/40">
                          <td className="p-3 font-mono font-bold text-slate-900">{r.id}</td>
                          <td className="p-3 text-sky-800 font-bold">{r.companyName || companies[0]?.name}</td>
                          <td className="p-3 font-bold text-slate-800">{r.customerName}</td>
                          <td className="p-3 font-mono text-slate-700">{r.date} à {r.time}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{r.guestsCount} pers.</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-100 text-sky-800">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-VIEW: CATALOGUE PRODUITS & STOCKS SYNCHRONISÉS */}
              {opsFilterTab === 'products' && (
                <div className="neu-pressed rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#DFE5ED] text-slate-600 font-mono text-[10px] font-bold border-b border-[#D1D9E6]">
                      <tr>
                        <th className="p-3">Produit / Service</th>
                        <th className="p-3">Catégorie</th>
                        <th className="p-3">Prix Unitaire</th>
                        <th className="p-3">Stock en Direct</th>
                        <th className="p-3">Disponibilité IA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1D9E6]/60">
                      {globalProducts.map((p: any, idx: number) => (
                        <tr key={p.id || idx} className="hover:bg-white/40">
                          <td className="p-3 font-bold text-slate-900">{p.name}</td>
                          <td className="p-3 text-slate-600">{p.category}</td>
                          <td className="p-3 font-mono font-extrabold text-emerald-700">{(p.price || 0).toLocaleString()} FCFA</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{p.stock} unités</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              p.status === 'Disponible' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUB-VIEW: CLIENTS CRM SYNCHRONISÉS */}
              {opsFilterTab === 'customers' && (
                <div className="neu-pressed rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#DFE5ED] text-slate-600 font-mono text-[10px] font-bold border-b border-[#D1D9E6]">
                      <tr>
                        <th className="p-3">Client</th>
                        <th className="p-3">Téléphone WhatsApp</th>
                        <th className="p-3">Segment CRM</th>
                        <th className="p-3">Total Dépensé</th>
                        <th className="p-3">Dernière Interaction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1D9E6]/60">
                      {globalCustomers.map((c: any, idx: number) => (
                        <tr key={c.id || idx} className="hover:bg-white/40">
                          <td className="p-3 font-bold text-slate-900">{c.name}</td>
                          <td className="p-3 font-mono text-slate-700">{c.phone}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800">
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-extrabold text-emerald-700">{(c.totalSpent || 0).toLocaleString()} FCFA</td>
                          <td className="p-3 text-slate-500">{c.lastContact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MODULES & LICENCES SYNCHRONISÉS */}
        {adminTab === 'modules' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl neu-flat border border-white/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-600" />
                  <span>Modules Autonomes & Licences Synchronisés</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Activez ou désactivez un module ici : le changement est immédiatement répercuté dans le Tableau de Bord Entreprise et dans les instructions des Agents IA.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                {globalModules.filter(m => m.enabled).length} / {globalModules.length} Modules Actifs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {globalModules.map((mod: any) => (
                <div key={mod.id} className="p-5 rounded-3xl neu-flat border border-white/80 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full neu-pill text-[10px] font-mono font-bold text-sky-800">
                        {mod.category || 'Opérations IA'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        mod.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {mod.enabled ? '● ACTIF' : '○ DÉSACTIVÉ'}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">{mod.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{mod.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleGlobalModule(mod.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      mod.enabled ? 'neu-btn text-amber-800 hover:text-amber-950' : 'neu-btn-primary text-white'
                    }`}
                  >
                    {mod.enabled ? 'Désactiver le module (Sync)' : 'Activer le module (Sync)'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: UTILISATION & TOKENS IA */}
        {adminTab === 'utilisation' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl neu-flat border border-white/80 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-sky-600" />
                    <span>Moteur IA Gemini & Consommation des Crédits par Entreprise</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Suivi en direct de l'indexation documentaire (RAG), de la taille des bases de connaissances et des tokens consommés.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                  Moteur : {aiStatusInfo?.engine || 'Google Gemini AI (@google/genai)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl neu-pressed">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Modèle Principal</span>
                  <span className="text-base font-extrabold font-mono text-sky-800 mt-1 block">
                    {aiStatusInfo?.primaryModel || 'gemini-2.5-flash'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl neu-pressed">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Base de Connaissances Sync</span>
                  <span className="text-base font-extrabold font-mono text-emerald-700 mt-1 block">
                    {(companies[0]?.knowledgeBase?.length || aiStatusInfo?.knowledgeLength || 0).toLocaleString()} caractères
                  </span>
                </div>
                <div className="p-4 rounded-2xl neu-pressed">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Documents Assimilés</span>
                  <span className="text-base font-extrabold font-mono text-indigo-700 mt-1 block">
                    {companies.reduce((acc, c) => acc + (c.documentsCount || c.documents?.length || 0), 0)} documents
                  </span>
                </div>
                <div className="p-4 rounded-2xl neu-pressed">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Échanges IA Traités</span>
                  <span className="text-base font-extrabold font-mono text-slate-900 mt-1 block">
                    {totalConversations} réponses
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PASSERELLE FOURNISSEUR WHATSAPP & QR CODE */}
        {adminTab === 'whatsapp_gateway' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header & Status Card */}
            <div className="p-6 sm:p-8 rounded-3xl neu-flat-lg border border-white/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D9E6]/80 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center shrink-0 ${
                    qrStatus === 'connected' ? 'text-emerald-700' : 'text-amber-600'
                  }`}>
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Serveur Baileys Admin — Envoi Authentification & Connexion (OTP)
                      </h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        qrStatus === 'connected' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {qrStatus === 'connected' ? '● CANAL AUTH ADMIN ACTIF' : 'SCAN REQUIS'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      <strong>Fonction 1 (Admin) :</strong> Ce numéro WhatsApp est dédié à l'envoi des codes d'authentification (OTP). Les sessions WhatsApp des Agents IA sont également supervisées ci-dessous en temps réel.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={fetchLiveWhatsAppStatus}
                    disabled={isFetchingQr}
                    className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingQr ? 'animate-spin text-sky-600' : ''}`} />
                    <span>Actualiser</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetSession}
                    disabled={isResettingSession}
                    className={`neu-btn px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                      qrStatus === 'connected' ? 'text-rose-700 hover:text-rose-900' : 'text-emerald-700 hover:text-emerald-900'
                    }`}
                  >
                    {isResettingSession ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>{qrStatus === 'connected' ? "Déconnecter l'appareil" : 'Nouveau QR Code'}</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Main 2-Column Gateway Controller */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2 items-start">
                
                {/* Left: The QR Code Scannable View */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-[#D1D9E6] shadow-sm space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Passerelle Baileys Multi-Appareils
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {qrStatus === 'connected' ? 'Session WhatsApp Active' : 'QR Code Officiel à Scanner'}
                    </h3>
                  </div>

                  {/* QR Image Box */}
                  <div className="w-full max-w-[240px] sm:max-w-[272px] aspect-square bg-white rounded-2xl p-2 flex flex-col items-center justify-center relative overflow-hidden border-2 border-slate-100 shadow-inner">
                    {qrStatus === 'connected' ? (
                      <div className="w-full h-full bg-emerald-900/95 rounded-xl flex flex-col items-center justify-center text-white p-4 text-center space-y-2 animate-fadeIn">
                        <div className="w-14 h-14 rounded-full bg-emerald-800/80 flex items-center justify-center text-emerald-300">
                          <Check className="w-8 h-8 stroke-[3]" />
                        </div>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 block">
                            Fournisseur Connecté
                          </span>
                          <span className="text-base font-extrabold text-white font-mono mt-0.5 block">
                            {connectedPhone}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-200/90 leading-tight">
                          Tous les codes de sécurité sont désormais envoyés depuis ce numéro WhatsApp.
                        </p>
                        {connectedAt && (
                          <span className="text-[9px] text-emerald-300/60 font-mono">
                            En ligne depuis {new Date(connectedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    ) : liveQrImage ? (
                      <div className="relative w-full h-full flex flex-col items-center justify-center p-1 bg-white">
                        <img
                          src={liveQrImage}
                          alt="QR Code WhatsApp Web"
                          className="w-full h-full object-contain select-none"
                          style={{ imageRendering: 'pixelated' }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Génération du QR Code WhatsApp...
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">
                            Connexion aux serveurs WhatsApp en cours
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetSession}
                          disabled={isResettingSession}
                          className="mt-2 text-[11px] px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 cursor-pointer inline-flex items-center gap-1 transition"
                        >
                          <RefreshCw className={`w-3 h-3 ${isResettingSession ? 'animate-spin' : ''}`} />
                          <span>Forcer l'apparition du QR</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {qrStatus !== 'connected' && (
                    <div className="w-full flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Expire dans 20s (auto-refresh)
                      </span>
                      <button
                        type="button"
                        onClick={handleResetSession}
                        disabled={isResettingSession}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isResettingSession ? 'animate-spin' : ''}`} />
                        <span>Régénérer QR Code</span>
                      </button>
                    </div>
                  )}

                  <div className={`w-full p-3 rounded-2xl text-xs font-semibold flex items-center justify-between ${
                    qrStatus === 'connected'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                  }`}>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${qrStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span>{qrStatus === 'connected' ? 'Prêt à expédier' : 'En attente de votre scan'}</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold">
                      {qrStatus === 'connected' ? '24/7 Autonome' : 'WhatsApp Web'}
                    </span>
                  </div>
                </div>

                {/* Right: How-to & Live Test Dispatcher */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Supervision en direct des sessions WhatsApp des Agents IA Entreprise */}
                  <div className="p-5 sm:p-6 rounded-3xl neu-flat space-y-3 border border-white/60">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Bot className="w-4 h-4 text-sky-600" />
                        <span>État Synchronisé des Sessions WhatsApp Agents IA ({allAgents.length})</span>
                      </h4>
                      {onSelectCompanyForDashboard && (
                        <button
                          onClick={() => onSelectCompanyForDashboard(companies[0] || DEFAULT_COMPANY)}
                          className="text-[11px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer flex items-center gap-1"
                        >
                          <span>Gérer dans le Dashboard</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {allAgents.map((ag) => (
                        <div key={`${ag.companyId}-${ag.id}`} className="p-3 rounded-2xl neu-pressed flex flex-col justify-between gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-slate-900">{ag.name}</span>
                            <span className={`w-2 h-2 rounded-full ${ag.whatsappStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          </div>
                          <span className="text-[10px] text-slate-500 truncate">{ag.roleTitle}</span>
                          <span className={`text-[10px] font-mono font-bold ${ag.whatsappStatus === 'connected' ? 'text-emerald-700' : 'text-amber-800'}`}>
                            {ag.whatsappStatus === 'connected' ? `Connecté (${ag.whatsappNumber})` : 'Prêt au scan QR'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct OTP Dispatcher */}
                  <div className="p-5 sm:p-6 rounded-3xl neu-flat space-y-4 border border-white/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Send className="w-4 h-4 text-emerald-600" />
                          <span>Envoi Direct d'un Code OTP WhatsApp</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          Expédiez un code d'authentification sécurisé directement via la passerelle WhatsApp active.
                        </p>
                      </div>
                      <span className="neu-pill px-2.5 py-0.5 text-[9px] font-mono font-bold text-emerald-800">
                        EXPÉDITION EN DIRECT
                      </span>
                    </div>

                    <form onSubmit={handleSendOtp} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Numéro WhatsApp destinataire
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otpPhoneNumber}
                            onChange={(e) => setOtpPhoneNumber(e.target.value)}
                            placeholder="Saisissez le numéro WhatsApp destinataire"
                            className="flex-1 neu-input rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-800 bg-transparent"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSendingOtp}
                            className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {isSendingOtp ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Envoi...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Envoyer Code OTP</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {otpResult && (
                        <div className={`p-3.5 rounded-2xl text-xs font-medium space-y-1.5 animate-fadeIn ${
                          otpResult.sentViaWhatsApp
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                            : otpResult.success
                            ? 'bg-sky-50 text-sky-900 border border-sky-300'
                            : 'bg-rose-50 text-rose-900 border border-rose-300'
                        }`}>
                          <div className="flex items-center justify-between font-bold">
                            <span>
                              {otpResult.sentViaWhatsApp 
                                ? '✅ Message WhatsApp Délivré en Direct !' 
                                : otpResult.success 
                                ? '⚡ Code généré (Passerelle en attente de scan)' 
                                : '❌ Erreur'}
                            </span>
                            {otpResult.code && (
                              <span className="font-mono text-sm px-2 py-0.5 rounded-lg bg-white/80 border border-current">
                                {otpResult.code}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px]">{otpResult.message}</p>
                        </div>
                      )}
                    </form>

                    {/* Latency Settings */}
                    <div className="pt-3 border-t border-[#D1D9E6]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          Délai de temporisation WhatsApp : {responseLatency}s
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          0s pour envoi instantané, ou 2s-10s pour temporisation naturelle.
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[0, 2, 5, 10].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => handleUpdateLatency(sec)}
                            disabled={isUpdatingLatency}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                              responseLatency === sec
                                ? 'neu-btn-primary text-white'
                                : 'neu-btn text-slate-700 hover:text-slate-900'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                    {latencySavedMessage && (
                      <p className="text-[11px] text-emerald-700 font-bold animate-fadeIn">{latencySavedMessage}</p>
                    )}
                  </div>

                </div>

              </div>
            </div>

            {/* Bottom Section: Recent WhatsApp Logs */}
            <div className="p-6 sm:p-8 rounded-3xl neu-flat border border-white/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-sky-700" />
                    <span>Derniers Messages WhatsApp & Réponses IA Synchronisés ({whatsappLogs.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Historique en temps réel des échanges WhatsApp gérés par la passerelle et les Agents IA.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => synchronizeAllPlatformData(true)}
                  disabled={isLoadingLogs}
                  className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin text-sky-600' : ''}`} />
                  <span>Rafraîchir logs</span>
                </button>
              </div>

              {whatsappLogs.length === 0 ? (
                <div className="p-6 rounded-2xl neu-pressed text-center text-xs text-slate-500 font-medium">
                  Aucun log de message WhatsApp pour le moment. Dès qu'un message ou code sera émis, il apparaîtra ici en temps réel.
                </div>
              ) : (
                <div className="neu-pressed rounded-2xl overflow-hidden border border-white/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#DFE5ED] text-slate-600 font-mono text-[10px] font-bold border-b border-[#D1D9E6]">
                        <tr>
                          <th className="p-3">Destinataire / Numéro</th>
                          <th className="p-3">Message Reçu / Type</th>
                          <th className="p-3">Réponse IA / Système</th>
                          <th className="p-3 text-right">Date & Heure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D1D9E6]/60">
                        {whatsappLogs.map((log: any, idx: number) => (
                          <tr key={log.id || idx} className="hover:bg-white/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-emerald-800">
                              {log.phone_number || log.sender || '—'}
                            </td>
                            <td className="p-3 text-slate-700 max-w-xs truncate">
                              {log.incoming_message || log.messageBody || log.message || '—'}
                            </td>
                            <td className="p-3 text-slate-800 font-medium max-w-xs truncate">
                              {log.reply_message || log.aiResponse || log.reply || '—'}
                            </td>
                            <td className="p-3 text-right font-mono text-[11px] text-slate-500">
                              {(log.created_at || log.timestamp) ? new Date(log.created_at || log.timestamp).toLocaleTimeString() : 'Récent'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB: PAIEMENTS PAYDUNYA & ABONNEMENTS */}
        {(adminTab === 'paiements' || adminTab === 'abonnements') && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl neu-flat-lg border border-white/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D9E6]/80 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-emerald-600 shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Passerelle PayDunya Officielle & Facturation Synchronisée
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ● PASSERELLE PAYDUNYA CONNECTÉE
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Encaissement direct en Francs CFA (XOF) via Wave, Orange Money, Free Money et Cartes Bancaires + Factures Entreprises synchronisées.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchPaydunyaData}
                    disabled={isLoadingPaydunya}
                    className="neu-btn px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPaydunya ? 'animate-spin text-emerald-600' : ''}`} />
                    <span>Actualiser transactions</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-2xl neu-pressed border border-white/40">
                  <span className="text-[10px] text-slate-500 font-medium block">Total Encaissé PayDunya</span>
                  <span className="text-xl font-extrabold font-mono text-emerald-700 block mt-1">
                    {paydunyaTransactions
                      .filter(t => t.status === 'success')
                      .reduce((sum, t) => sum + (t.amount || 0), 0)
                      .toLocaleString()} FCFA
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    {paydunyaTransactions.filter(t => t.status === 'success').length} paiements réussis
                  </span>
                </div>

                <div className="p-4 rounded-2xl neu-pressed border border-white/40">
                  <span className="text-[10px] text-slate-500 font-medium block">Chiffre d'Affaires Commandes</span>
                  <span className="text-xl font-extrabold font-mono text-sky-700 block mt-1">
                    {totalRevenueXOF.toLocaleString()} FCFA
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    {globalOrders.length} commandes synchronisées
                  </span>
                </div>

                <div className="p-4 rounded-2xl neu-pressed border border-white/40">
                  <span className="text-[10px] text-slate-500 font-medium block">Revenus Abonnements SaaS</span>
                  <span className="text-xl font-extrabold font-mono text-amber-700 block mt-1">
                    {realMRR.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    {companies.length} entreprise(s) enregistrée(s)
                  </span>
                </div>

                <div className="p-4 rounded-2xl neu-pressed border border-white/40">
                  <span className="text-[10px] text-slate-500 font-medium block">Factures Émises (Dashboard)</span>
                  <span className="text-xl font-extrabold font-mono text-indigo-700 block mt-1">
                    {globalInvoices.length} factures
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    Synchronisées en direct
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 sm:p-8 rounded-3xl neu-flat border border-white/80 space-y-4">
                <div className="flex items-center justify-between border-b border-[#D1D9E6]/70 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Configuration Clés API PayDunya
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    Mode Production
                  </span>
                </div>

                <form onSubmit={handleSavePaydunyaConfig} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        PayDunya Master Key (Clé Principale)
                      </label>
                      <input
                        type="text"
                        value={paydunyaMasterKey}
                        onChange={(e) => setPaydunyaMasterKey(e.target.value)}
                        placeholder={paydunyaConfig?.masterKey || "Ex: DbDQF7UZ-eGTd-..."}
                        className="w-full px-3.5 py-2.5 rounded-xl neu-pressed text-xs font-mono text-slate-800 outline-none border border-white/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        PayDunya Public Key (Clé Publique)
                      </label>
                      <input
                        type="text"
                        value={paydunyaPublicKey}
                        onChange={(e) => setPaydunyaPublicKey(e.target.value)}
                        placeholder={paydunyaConfig?.publicKey || "Ex: live_public_..."}
                        className="w-full px-3.5 py-2.5 rounded-xl neu-pressed text-xs font-mono text-slate-800 outline-none border border-white/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        PayDunya Private Key (Clé Privée)
                      </label>
                      <input
                        type="password"
                        value={paydunyaPrivateKey}
                        onChange={(e) => setPaydunyaPrivateKey(e.target.value)}
                        placeholder={paydunyaConfig?.privateKey || "••••••••••••••••••••••••••••••••"}
                        className="w-full px-3.5 py-2.5 rounded-xl neu-pressed text-xs font-mono text-slate-800 outline-none border border-white/40"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        PayDunya Token (Jeton d'API)
                      </label>
                      <input
                        type="text"
                        value={paydunyaToken}
                        onChange={(e) => setPaydunyaToken(e.target.value)}
                        placeholder={paydunyaConfig?.token || "Ex: tok_..."}
                        className="w-full px-3.5 py-2.5 rounded-xl neu-pressed text-xs font-mono text-slate-800 outline-none border border-white/40"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Numéro Wave Direct (Secours) :
                        </label>
                        <input
                          type="text"
                          value={directWavePhone}
                          onChange={(e) => setDirectWavePhone(e.target.value)}
                          placeholder="Numéro Wave"
                          className="w-full px-3 py-2 rounded-xl neu-pressed text-xs font-mono text-slate-800 outline-none border border-white/40"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Numéro OM Direct (Secours) :
                        </label>
                        <input
                          type="text"
                          value={directOmPhone}
                          onChange={(e) => setDirectOmPhone(e.target.value)}
                          placeholder="Numéro Orange Money"
                          className="w-full px-3 py-2 rounded-xl neu-pressed text-xs font-mono text-slate-800 outline-none border border-white/40"
                        />
                      </div>
                    </div>
                  </div>

                  {paydunyaSaveNotice && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                      {paydunyaSaveNotice}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingPaydunya}
                    className="w-full py-3 rounded-xl neu-btn-primary text-white text-xs font-extrabold cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Enregistrer la configuration PayDunya</span>
                  </button>
                </form>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl neu-flat border border-white/80 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-[#D1D9E6]/70 pb-3 mb-3">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-slate-900">
                      URL de Notification Instantanée (IPN Webhook)
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                    Copiez cette URL dans les paramètres de votre compte marchand sur <span className="font-bold text-slate-800">paydunya.com</span>. PayDunya notifiera automatiquement votre plateforme dès qu'un client règle via Wave, OM ou Carte bancaire.
                  </p>

                  <div className="p-3 rounded-xl neu-pressed font-mono text-xs text-slate-800 break-all select-all border border-white/40">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/paydunya/ipn` : 'https://smgflow.pro/api/paydunya/ipn'}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#D1D9E6]/70 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>Vérification Cryptographique IPN SHA-512 Active</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Toutes les notifications entrantes sont vérifiées par signature SHA-512 avec votre Master Key avant l'attribution automatique des crédits et l'activation des abonnements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ACTIVITÉ SYSTÈME, MAINTENANCE & SUPPORT */}
        {(adminTab === 'maintenance' || adminTab === 'support' || adminTab === 'activite') && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl neu-flat border border-white/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-sky-700" />
                  Surveillance Infrastructure & Télémétrie Baileys ({adminTab.toUpperCase()})
                </h3>
                <span className="text-emerald-700 font-mono text-xs font-bold">Clusters Opérationnels • Sync 2.5s</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Tous les clusters d'inférence Gemini, passerelles WhatsApp Baileys et bases de données d'entreprises sont synchronisés en temps réel.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-2xl neu-pressed border border-white/40">
                  <span className="text-[10px] text-slate-500 font-medium block">Mémoire Serveur Node</span>
                  <span className="text-xl font-extrabold font-mono text-sky-800">
                    {serverMetrics?.memoryUsageMB ? `${serverMetrics.memoryUsageMB} MB` : '0 MB'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl neu-pressed border border-white/40">
                  <span className="text-[10px] text-slate-500 font-medium block">Uptime Passerelle</span>
                  <span className="text-xl font-extrabold font-mono text-slate-900">
                    {serverMetrics?.uptimeFormatted || '24/7 Actif'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl neu-pressed border border-white/40">
                  <span className="text-[10px] text-slate-500 font-medium block">Sessions Baileys Actives</span>
                  <span className="text-xl font-extrabold font-mono text-emerald-700">
                    {(qrStatus === 'connected' ? 1 : 0) + allAgents.filter(a => a.whatsappStatus === 'connected').length} session(s)
                  </span>
                </div>
                <div className="p-4 rounded-2xl neu-pressed border border-white/40">
                  <span className="text-[10px] text-slate-500 font-medium block">Dernière Sync Globale</span>
                  <span className="text-xl font-extrabold font-mono text-indigo-700">{lastSyncTime}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: INSPECTION COMPLÈTE & SYNCHRONISÉE DE L'ENTREPRISE */}
      {selectedCompany && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedCompany(null)}
        >
          <div 
            className="w-full max-w-4xl bg-[#ECF0F3] rounded-3xl p-6 sm:p-8 neu-flat border border-white/90 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCompany(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-2xl neu-btn flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D9E6] pb-4 pr-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl neu-pressed flex items-center justify-center text-sky-700 shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {selectedCompany.name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      selectedCompany.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {selectedCompany.status === 'active' ? '● ACTIF' : '● EN PAUSE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Secteur : <strong className="text-slate-700">{selectedCompany.industry}</strong> • ID : <span className="font-mono">{selectedCompany.id}</span> • Forfait : <strong className="uppercase">{selectedCompany.plan || 'PRO'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAgentStatus(selectedCompany.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    selectedCompany.status === 'active' ? 'neu-btn text-amber-800' : 'neu-btn-primary text-white'
                  }`}
                >
                  {selectedCompany.status === 'active' ? 'Mettre en pause' : 'Activer'}
                </button>
                {onSelectCompanyForDashboard && (
                  <button
                    onClick={() => {
                      onSelectCompanyForDashboard(selectedCompany);
                      setSelectedCompany(null);
                    }}
                    className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Ouvrir son Dashboard</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Synchronized Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl neu-pressed">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Catalogue & Stocks</span>
                <span className="text-base font-extrabold font-mono text-indigo-700">
                  {selectedCompany.products?.length || selectedCompany.productsCount || 0} produits
                </span>
              </div>
              <div className="p-3.5 rounded-2xl neu-pressed">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Commandes Clients</span>
                <span className="text-base font-extrabold font-mono text-emerald-700">
                  {selectedCompany.orders?.length || selectedCompany.ordersCount || 0} commandes
                </span>
              </div>
              <div className="p-3.5 rounded-2xl neu-pressed">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Réservations & RDV</span>
                <span className="text-base font-extrabold font-mono text-amber-700">
                  {selectedCompany.reservations?.length || selectedCompany.appointmentsCount || 0} réservations
                </span>
              </div>
              <div className="p-3.5 rounded-2xl neu-pressed">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Clients CRM</span>
                <span className="text-base font-extrabold font-mono text-slate-900">
                  {selectedCompany.customers?.length || selectedCompany.customersCount || 0} clients
                </span>
              </div>
            </div>

            {/* Synchronized Agents List of this Company */}
            {Array.isArray(selectedCompany.agentsList) && selectedCompany.agentsList.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-600 uppercase">
                  Agents IA de l'entreprise ({selectedCompany.agentsList.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedCompany.agentsList.map((ag: any) => (
                    <div key={ag.id} className="p-3 rounded-2xl neu-pressed flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">{ag.name}</span>
                        <span className="text-[10px] text-slate-500 block">{ag.roleTitle}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        ag.whatsappStatus === 'connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ag.whatsappStatus === 'connected' ? 'Connecté' : 'Scan QR'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Knowledge Base Snapshot Preview */}
            {selectedCompany.knowledgeBase && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-slate-600 uppercase">
                  Base de Connaissances & Données Opérationnelles Synchronisées avec l'IA
                </h4>
                <pre className="p-4 rounded-2xl neu-pressed text-[11px] font-mono text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {selectedCompany.knowledgeBase}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Native Mobile Bottom Navigation Bar (< md) */}
      <nav
        aria-label="Navigation Super Admin Mobile"
        className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {adminMenuItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAdminTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#0052CC] bg-[#EBF2FF] font-extrabold'
                    : 'text-slate-500 hover:text-slate-900 font-semibold'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0052CC]' : 'text-slate-500'}`} />
                <span className="text-[10px] leading-none truncate max-w-full">{item.shortLabel}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-slate-600 hover:text-[#0052CC] font-semibold cursor-pointer"
          >
            <Menu className="w-4 h-4 text-[#0052CC]" />
            <span className="text-[10px] leading-none truncate max-w-full">Plus (11)</span>
          </button>
        </div>
      </nav>

    </div>
  );
};
