import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  Users, 
  ShoppingBag, 
  Utensils, 
  Calendar as CalendarIcon, 
  Package, 
  FileText, 
  Sliders, 
  SlidersHorizontal, 
  Settings, 
  Smartphone, 
  QrCode, 
  Send, 
  Plus, 
  Trash2, 
  Check, 
  CheckCircle2, 
  Clock, 
  Loader2,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Zap,
  RefreshCw,
  LogOut,
  ToggleLeft,
  ToggleRight,
  Search,
  CheckCheck,
  Sparkles,
  Lock,
  Filter,
  User,
  Building2,
  Upload,
  AlertTriangle,
  ArrowRight,
  Crown,
  Server,
  Database,
  Menu,
  X
} from 'lucide-react';
import { 
  CompanyProfile, 
  DashboardTab, 
  CustomerCRMItem, 
  OrderItem, 
  ReservationItem, 
  CalendarSlot, 
  ProductItem, 
  InvoiceItem, 
  InstructionRule, 
  PlatformModule,
  EnterpriseAgent,
  AgentRoleType
} from '../types';
import { MOCK_MODULES, MOCK_INSTRUCTIONS } from '../data/mockData';
import { accountStorage } from '../lib/accountStorage';
import { PayDunyaModal } from './PayDunyaModal.tsx';
import { WaveLogo, OrangeMoneyLogo, FreeMoneyLogo, VisaLogo, MastercardLogo, PayDunyaLogo } from './PaymentLogos.tsx';
import QRCode from 'qrcode';
import { api } from '../lib/api.ts';
import { supabaseService } from '../lib/supabase.ts';
import { CreateAgentWizard } from './CreateAgentWizard.tsx';
import { WhatsAppWebModal } from './WhatsAppWebModal.tsx';
import { WhatsAppServerConsole } from './WhatsAppServerConsole.tsx';

interface EnterpriseDashboardProps {
  company: CompanyProfile;
  onLogout: () => void;
  onViewLanding?: () => void;
  onSelectTab?: (tab: DashboardTab) => void;
  initialTab?: DashboardTab;
}

export const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({
  company: initialCompany,
  onLogout,
  onViewLanding,
  initialTab = 'overview'
}) => {
  const [activeCompany, setActiveCompany] = useState<CompanyProfile>(initialCompany);
  const [currentTab, setCurrentTab] = useState<DashboardTab>(initialTab);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>('À l\'instant');
  const [showWizardModal, setShowWizardModal] = useState<boolean>(false);
  
  // VIP Free Account Flag: Exclusively for mgaye60000@gmail.com
  const isVipFreeUser = Boolean(
    activeCompany.isVipFree || 
    activeCompany.email?.trim().toLowerCase() === 'mgaye60000@gmail.com'
  );

  // PayTech & Billing State
  const [activePlan, setActivePlan] = useState<'starter' | 'pro' | 'business' | 'enterprise_125k'>(
    isVipFreeUser ? 'enterprise_125k' : ((activeCompany.plan as any) || 'pro')
  );
  const [companyCreditsLimit, setCompanyCreditsLimit] = useState<number>(
    activeCompany.monthlyCreditsLimit || 0
  );
  const [paytechModalData, setPaytechModalData] = useState<{
    itemName: string;
    itemPriceFCFA: number;
    itemPriceEUR?: number;
    planId?: string;
    creditsAdded?: number;
  } | null>(null);
  const [paytechSuccessBanner, setPaytechSuccessBanner] = useState<string | null>(null);

  // Filter by Agent (Unlocked if Plan >= 125 000 FCFA or VIP User)
  const isPlan125kOrMore = isVipFreeUser || activePlan === 'enterprise_125k' || (activeCompany.planPriceXOF && activeCompany.planPriceXOF >= 125000);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');

  // Load persisted dashboard data if available
  const savedDashboardData = React.useMemo(() => accountStorage.getCompanyData(initialCompany.id), [initialCompany.id]);

  // Multi-Agents collection (vide par défaut, uniquement les agents réellement créés)
  const [agentsList, setAgentsList] = useState<EnterpriseAgent[]>(
    Array.isArray(savedDashboardData?.agentsList) ? savedDashboardData.agentsList : []
  );

  const FALLBACK_EMPTY_AGENT: EnterpriseAgent = {
    id: 'agent-default',
    name: activeCompany.agentName || 'Aucun agent configuré',
    roleType: 'customer_service',
    roleTitle: 'Agent IA',
    description: '',
    welcomeMessage: '',
    channels: ['whatsapp'],
    whatsappNumber: activeCompany.phone || '',
    whatsappStatus: 'disconnected',
    status: 'active',
    knowledgeText: '',
    promptInstruction: '',
    conversationsCount: 0,
    createdAt: ''
  };

  // Active agent selected for testing / editing
  const currentAgent = agentsList.find(a => a.id === selectedAgentFilter) || agentsList[0] || FALLBACK_EMPTY_AGENT;

  // Specific agent chosen to connect or disconnect in WhatsApp Scanner Tab
  const [selectedWhatsAppAgentId, setSelectedWhatsAppAgentId] = useState<string>(agentsList[0]?.id || 'agent-default');
  const [isScanningWhatsApp, setIsScanningWhatsApp] = useState<boolean>(false);
  const [scanningProgress, setScanningProgress] = useState<number>(0);
  const [qrRefreshCountdown, setQrRefreshCountdown] = useState<number>(20);
  const [whatsappToast, setWhatsappToast] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Dedicated WhatsApp Agent Simulator chat
  const [waSimInput, setWaSimInput] = useState<string>('');
  const [waSimChat, setWaSimChat] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string; detectedRole?: string }>>([]);
  const [isWaSimLoading, setIsWaSimLoading] = useState<boolean>(false);

  // WhatsApp Gateway States
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showWhatsAppWebModal, setShowWhatsAppWebModal] = useState<boolean>(false);
  const [whatsappSubView, setWhatsappSubView] = useState<'scanner' | 'servers'>('scanner');
  const [qrStatus, setQrStatus] = useState<'disconnected' | 'connecting' | 'qr_ready' | 'connected'>('disconnected');
  const [liveQrImage, setLiveQrImage] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [isFetchingQr, setIsFetchingQr] = useState<boolean>(false);
  const [responseLatency, setResponseLatency] = useState<number>(0);
  const [whatsappLogs, setWhatsappLogs] = useState<any[]>([]);
  const [pairingCode, setPairingCode] = useState<string>('');
  const [linkMode, setLinkMode] = useState<'qr' | 'code'>('qr');

  // Simulator
  const [simInput, setSimInput] = useState('');
  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);
  const [simChat, setSimChat] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string; detectedRole?: string }>>([]);
  const [isSimLoading, setIsSimLoading] = useState(false);

  // Step 4: Knowledge Base & AI Document Assimilation State
  const [knowledgeTextState, setKnowledgeTextState] = useState<string>(
    currentAgent.knowledgeText || ''
  );
  const [uploadedDocs, setUploadedDocs] = useState<Array<{
    id: string;
    title: string;
    type: string;
    size: string;
    summary?: string;
    content: string;
    updatedAt: string;
  }>>([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isAssimilatingDoc, setIsAssimilatingDoc] = useState(false);

  // Live AI Changes Pilot State (updates both Knowledge Base & Instructions + syncs to Baileys WhatsApp)
  const [liveChangeDirective, setLiveChangeDirective] = useState('');
  const [isApplyingLiveChange, setIsApplyingLiveChange] = useState(false);
  const [lastAppliedChangeReport, setLastAppliedChangeReport] = useState<{
    summaryOfChanges: string;
    appliedRules: string[];
    timestamp: string;
  } | null>(null);
  const [pairingPhoneInput, setPairingPhoneInput] = useState('');
  const [isRequestingPairingCode, setIsRequestingPairingCode] = useState(false);

  // Step 5: Dual-pane Prompt & Guide Copilot State
  const [promptTextState, setPromptTextState] = useState<string>(
    currentAgent.promptInstruction || ''
  );
  const [guideChat, setGuideChat] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [guideInput, setGuideInput] = useState('');
  const [isGuideLoading, setIsGuideLoading] = useState(false);

  // Data collections (100% vierges par défaut, aucune fausse donnée)
  const [customers, setCustomers] = useState<CustomerCRMItem[]>(
    Array.isArray(savedDashboardData?.customers) ? savedDashboardData.customers : []
  );
  const [orders, setOrders] = useState<OrderItem[]>(
    Array.isArray(savedDashboardData?.orders) ? savedDashboardData.orders : []
  );
  const [reservations, setReservations] = useState<ReservationItem[]>(
    Array.isArray(savedDashboardData?.reservations) ? savedDashboardData.reservations : []
  );
  const [calendarSlots, setCalendarSlots] = useState<CalendarSlot[]>(
    Array.isArray(savedDashboardData?.calendarSlots) ? savedDashboardData.calendarSlots : []
  );
  const [products, setProducts] = useState<ProductItem[]>(
    Array.isArray(savedDashboardData?.products) ? savedDashboardData.products : []
  );
  const [invoices, setInvoices] = useState<InvoiceItem[]>(
    Array.isArray(savedDashboardData?.invoices) ? savedDashboardData.invoices : []
  );
  const [instructions, setInstructions] = useState<InstructionRule[]>(
    Array.isArray(savedDashboardData?.instructions) ? savedDashboardData.instructions : MOCK_INSTRUCTIONS
  );
  const [modules, setModules] = useState<PlatformModule[]>(
    Array.isArray(savedDashboardData?.modules) && savedDashboardData.modules.length > 0
      ? savedDashboardData.modules
      : MOCK_MODULES
  );
  const [newRuleText, setNewRuleText] = useState('');

  // Détection automatique du pays de connexion selon le numéro du compte ou le fuseau horaire de connexion
  const detectDefaultCountryCode = (phoneInput?: string) => {
    const phone = (phoneInput || initialCompany.phone || '').replace(/\s+/g, '');
    if (phone.startsWith('+225')) return 'CI';
    if (phone.startsWith('+223')) return 'ML';
    if (phone.startsWith('+226')) return 'BF';
    if (phone.startsWith('+224')) return 'GN';
    if (phone.startsWith('+229')) return 'BJ';
    if (phone.startsWith('+228')) return 'TG';
    if (phone.startsWith('+237')) return 'CM';
    if (phone.startsWith('+212')) return 'MA';
    if (phone.startsWith('+33')) return 'FR';
    if (phone.startsWith('+221')) return 'SN';

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Abidjan')) return 'CI';
      if (tz.includes('Bamako')) return 'ML';
      if (tz.includes('Ouagadougou')) return 'BF';
      if (tz.includes('Conakry')) return 'GN';
      if (tz.includes('Porto-Novo')) return 'BJ';
      if (tz.includes('Lome')) return 'TG';
      if (tz.includes('Douala')) return 'CM';
      if (tz.includes('Casablanca')) return 'MA';
      if (tz.includes('Paris')) return 'FR';
    } catch {
      // ignore
    }
    return 'SN';
  };

  const COUNTRY_PAYMENT_PRESETS: Record<string, {
    name: string;
    flag: string;
    dialCode: string;
    currency: string;
    primaryMethods: string[];
    localThirdLabel: string;
    localThirdPlaceholder: string;
  }> = {
    SN: {
      name: 'Sénégal',
      flag: '🇸🇳',
      dialCode: '+221',
      currency: 'FCFA',
      primaryMethods: ['Wave Sénégal', 'Orange Money Sénégal', 'Free Money / Yas', 'Wizall / Espèces'],
      localThirdLabel: 'Numéro Free Money / Yas',
      localThirdPlaceholder: 'Numéro Free Money / Yas'
    },
    CI: {
      name: "Côte d'Ivoire",
      flag: '🇨🇮',
      dialCode: '+225',
      currency: 'FCFA',
      primaryMethods: ['Wave Côte d’Ivoire', 'Orange Money CI', 'MTN MoMo', 'Moov Money / Djamo'],
      localThirdLabel: 'Numéro MTN Mobile Money (MoMo)',
      localThirdPlaceholder: 'Numéro MTN Mobile Money'
    },
    ML: {
      name: 'Mali',
      flag: '🇲🇱',
      dialCode: '+223',
      currency: 'FCFA',
      primaryMethods: ['Orange Money Mali', 'Wave Mali', 'Moov Money / Malitel', 'Sama Money'],
      localThirdLabel: 'Numéro Moov Money / Sama Money',
      localThirdPlaceholder: 'Numéro Moov / Sama Money'
    },
    BF: {
      name: 'Burkina Faso',
      flag: '🇧🇫',
      dialCode: '+226',
      currency: 'FCFA',
      primaryMethods: ['Orange Money Burkina', 'Wave Burkina', 'Moov Money', 'Coris Money'],
      localThirdLabel: 'Numéro Moov Money / Coris Money',
      localThirdPlaceholder: 'Numéro Moov / Coris Money'
    },
    GN: {
      name: 'Guinée',
      flag: '🇬🇳',
      dialCode: '+224',
      currency: 'GNF',
      primaryMethods: ['Orange Money Guinée', 'MTN Mobile Money (MoMo)', 'PayCard', 'Espèces'],
      localThirdLabel: 'Numéro MTN Mobile Money / PayCard',
      localThirdPlaceholder: 'Numéro MTN / PayCard'
    },
    BJ: {
      name: 'Bénin',
      flag: '🇧🇯',
      dialCode: '+229',
      currency: 'FCFA',
      primaryMethods: ['MTN Mobile Money', 'Moov Money', 'Celtiis Cash', 'Wave'],
      localThirdLabel: 'Numéro MTN MoMo / Moov Money',
      localThirdPlaceholder: 'Numéro MTN / Moov Money'
    },
    TG: {
      name: 'Togo',
      flag: '🇹🇬',
      dialCode: '+228',
      currency: 'FCFA',
      primaryMethods: ['Mixx by Yas (T-Money)', 'Flooz (Moov)', 'Wave'],
      localThirdLabel: 'Numéro T-Money / Flooz',
      localThirdPlaceholder: 'Numéro T-Money / Flooz'
    },
    CM: {
      name: 'Cameroun',
      flag: '🇨🇲',
      dialCode: '+237',
      currency: 'FCFA',
      primaryMethods: ['Orange Money Cameroun', 'MTN Mobile Money (MoMo)', 'Espèces'],
      localThirdLabel: 'Numéro MTN Mobile Money (MoMo)',
      localThirdPlaceholder: 'Numéro MTN Mobile Money'
    },
    MA: {
      name: 'Maroc',
      flag: '🇲🇦',
      dialCode: '+212',
      currency: 'MAD',
      primaryMethods: ['Wafacash / CashPlus', 'Virement CIH / Attijari', 'Orange Money Maroc'],
      localThirdLabel: 'Numéro Wafacash / CashPlus / RIB CIH',
      localThirdPlaceholder: 'Numéro Wafacash / CashPlus'
    },
    FR: {
      name: 'France / Europe & Diaspora',
      flag: '🇫🇷',
      dialCode: '+33',
      currency: 'EUR / FCFA',
      primaryMethods: ['Wave (Envoi Diaspora)', 'Orange Money', 'Paylib / Wero / PayPal', 'Virement IBAN'],
      localThirdLabel: 'Numéro Wero / Paylib / PayPal',
      localThirdPlaceholder: 'Numéro Wero / Paylib / PayPal'
    }
  };

  // Sous-page active dans la page Base de Connaissances (Base de Données)
  const [knowledgeSubPage, setKnowledgeSubPage] = useState<'database_docs' | 'payment_numbers'>('database_docs');
  const [paymentCountry, setPaymentCountry] = useState<string>(
    savedDashboardData?.merchantPayment?.country ?? detectDefaultCountryCode()
  );
  const [merchantWavePhone, setMerchantWavePhone] = useState<string>(
    savedDashboardData?.merchantPayment?.wavePhone ?? ''
  );
  const [merchantOmPhone, setMerchantOmPhone] = useState<string>(
    savedDashboardData?.merchantPayment?.omPhone ?? ''
  );
  const [merchantLocalThirdPhone, setMerchantLocalThirdPhone] = useState<string>(
    savedDashboardData?.merchantPayment?.localThirdPhone ?? ''
  );
  const [merchantCustomMethodName, setMerchantCustomMethodName] = useState<string>(
    savedDashboardData?.merchantPayment?.customMethodName ?? ''
  );
  const [merchantCustomMethodPhone, setMerchantCustomMethodPhone] = useState<string>(
    savedDashboardData?.merchantPayment?.customMethodPhone ?? ''
  );
  const [autoSendPaymentLink, setAutoSendPaymentLink] = useState<boolean>(
    savedDashboardData?.merchantPayment?.autoSend ?? true
  );

  const currentCountryPreset = COUNTRY_PAYMENT_PRESETS[paymentCountry] || COUNTRY_PAYMENT_PRESETS.SN;

  // Operations quick tab
  const [opsSubTab, setOpsSubTab] = useState<'crm' | 'orders' | 'reservations'>('crm');

  const DASHBOARD_SYNC_MARKER = '\n# === DONNÉES OPÉRATIONNELLES EN DIRECT DU TABLEAU DE BORD ===';

  const stripDashboardAutoSection = (text: string) => {
    if (!text) return '';
    const idx = text.indexOf(DASHBOARD_SYNC_MARKER);
    return (idx >= 0 ? text.slice(0, idx) : text).trim();
  };

  // Compilation intégrale de TOUTES les données du Tableau de Bord pour l'IA (WhatsApp Baileys & Simulateurs)
  const buildFullDashboardKnowledge = (baseText?: string) => {
    const rawCore = (baseText !== undefined ? baseText : knowledgeTextState) || currentAgent.knowledgeText || '';
    const coreKnowledge = stripDashboardAutoSection(rawCore);

    const productsSection = products.length > 0
      ? products.map(p => `- Produit/Service : ${p.name} | Catégorie : ${p.category} | Prix : ${p.price.toLocaleString()} FCFA | Stock : ${p.stock} | Statut : ${p.status}`).join('\n')
      : 'Aucun produit enregistré.';

    const ordersSection = orders.length > 0
      ? orders.map(o => `- Commande ${o.id} | Client : ${o.customerName} | Articles : ${Array.isArray(o.items) ? o.items.join(', ') : o.items} | Total : ${o.totalAmount.toLocaleString()} FCFA | Statut : ${o.status} (${o.createdAt})`).join('\n')
      : 'Aucune commande en cours.';

    const reservationsSection = reservations.length > 0
      ? reservations.map(r => `- Réservation ${r.id} | Client : ${r.customerName} | Date : ${r.date} à ${r.time} | Convives : ${r.guestsCount} pers. | Statut : ${r.status}${r.notes ? ` | Note : ${r.notes}` : ''}`).join('\n')
      : 'Aucune réservation enregistrée.';

    const calendarSection = calendarSlots.length > 0
      ? calendarSlots.map(c => `- Créneau Agenda : ${c.title} (${c.type}) | Client : ${c.clientName} | Date : ${c.date} à ${c.time} (${c.durationMinutes} min) | Statut : ${c.status}`).join('\n')
      : 'Aucun créneau planifié.';

    const invoicesSection = invoices.length > 0
      ? invoices.map(inv => `- Facture ${inv.id} | Client : ${inv.customerName} | Montant : ${inv.amount.toLocaleString()} FCFA | Statut : ${inv.status} | Date : ${inv.date}`).join('\n')
      : 'Aucune facture émise.';

    const customersSection = customers.length > 0
      ? customers.map(c => `- Client CRM : ${c.name} (${c.phone}) | Statut : ${c.status} | Total achats : ${c.totalSpent.toLocaleString()} FCFA`).join('\n')
      : 'Aucun client enregistré.';

    const activeRulesSection = instructions.filter(i => i.active).length > 0
      ? instructions.filter(i => i.active).map(i => `- [${i.category}] ${i.rule}`).join('\n')
      : 'Aucune règle spécifique active.';

    const activeModulesSection = modules.filter(m => m.enabled).length > 0
      ? modules.filter(m => m.enabled).map(m => `- Module actif : ${m.name} (${m.description})`).join('\n')
      : 'Modules standards actifs.';

    const docsSection = uploadedDocs.length > 0
      ? uploadedDocs.map(d => `### Document : ${d.title}\n${d.content}`).join('\n\n')
      : '';

    const merchantPaymentSection = [
      `- Pays de connexion & encaissement configuré : ${currentCountryPreset.flag} ${currentCountryPreset.name} (${currentCountryPreset.dialCode})`,
      `- Envoi automatique du numéro de paiement aux commandeurs sur WhatsApp : ${autoSendPaymentLink ? 'OUI (Dès qu\'un client commande ou veut payer, l\'IA lui envoie directement le numéro)' : 'Sur demande du client'}`,
      merchantWavePhone ? `- Numéro Wave à envoyer au client : ${merchantWavePhone}` : '',
      merchantOmPhone ? `- Numéro Orange Money à envoyer au client : ${merchantOmPhone}` : '',
      merchantLocalThirdPhone ? `- ${currentCountryPreset.localThirdLabel} : ${merchantLocalThirdPhone}` : '',
      merchantCustomMethodPhone ? `- ${merchantCustomMethodName || 'Autre moyen de paiement'} : ${merchantCustomMethodPhone}` : '',
      `- Consigne IA Paiement Commande : Si un client qui passe commande ("commandeur") veut payer ou demande comment régler sur WhatsApp, calcule le montant total de sa commande et envoie-lui directement le numéro Wave (${merchantWavePhone || 'non renseigné'}), le numéro Orange Money (${merchantOmPhone || 'non renseigné'})${merchantLocalThirdPhone ? `, ou ${currentCountryPreset.localThirdLabel} (${merchantLocalThirdPhone})` : ''}${merchantCustomMethodPhone ? `, ou ${merchantCustomMethodName} (${merchantCustomMethodPhone})` : ''}.`
    ].filter(Boolean).join('\n');

    return [
      coreKnowledge,
      docsSection,
      DASHBOARD_SYNC_MARKER,
      `## NUMÉROS DE PAIEMENT DE L'ENTREPRISE SELON LE PAYS (${currentCountryPreset.name.toUpperCase()})`,
      merchantPaymentSection,
      `\n## CATALOGUE PRODUITS, TARIFS EN FCFA & STOCKS EN DIRECT`,
      productsSection,
      `\n## COMMANDES CLIENTS ENREGISTRÉES`,
      ordersSection,
      `\n## RÉSERVATIONS DE TABLES / RENDEZ-VOUS`,
      reservationsSection,
      `\n## CRÉNEAUX D'AGENDA & PLANNING`,
      calendarSection,
      `\n## FACTURATION & PAIEMENTS`,
      invoicesSection,
      `\n## RÉPERTOIRE CLIENTS CRM`,
      customersSection,
      `\n## RÈGLES D'INSTRUCTIONS ACTIVES & MODULES AUTONOMES`,
      activeRulesSection,
      activeModulesSection
    ].filter(Boolean).join('\n');
  };

  // Synchronisation complète et immédiate vers le serveur (IA, WhatsApp Baileys & Dashboard Super Admin)
  const pushFullDashboardSyncToServer = async (silent = true) => {
    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const activeStrictRules = instructions.filter(i => i.active).map(i => i.rule);
      const fullKnowledge = buildFullDashboardKnowledge(knowledgeTextState);

      await fetch('/api/company/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          companyId: activeCompany.id,
          company: activeCompany,
          customers,
          orders,
          reservations,
          calendarSlots,
          products,
          invoices,
          instructions,
          modules,
          agentsList,
          documents: uploadedDocs,
          knowledgeBase: fullKnowledge,
          customInstructions: promptTextState
        })
      });

      agentsList.forEach(ag => {
        const baseKnow = ag.id === currentAgent.id ? knowledgeTextState : (ag.knowledgeText || knowledgeTextState);
        const baseInst = ag.id === currentAgent.id ? promptTextState : (ag.promptInstruction || promptTextState);
        const agentFullKnowledge = buildFullDashboardKnowledge(baseKnow);

        fetch('/api/ai/context', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            companyId: activeCompany.id,
            agentId: ag.id,
            companyName: activeCompany.name,
            industry: activeCompany.industry,
            agentName: ag.name,
            roleType: ag.roleType,
            roleTitle: ag.roleTitle,
            welcomeMessage: ag.welcomeMessage,
            knowledgeBase: agentFullKnowledge,
            customInstructions: baseInst,
            strictRules: activeStrictRules,
            documents: uploadedDocs,
            products,
            orders,
            reservations,
            calendarSlots,
            invoices,
            customers,
            instructionsList: instructions,
            modules,
            agentsList
          })
        }).catch(() => {});
      });

      setLastAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (!silent) {
        showToast('Synchronisation complète effectuée avec le Dashboard Super Admin, les Agents IA et WhatsApp !', 'success');
      }
    } catch (e) {
      if (!silent) {
        showToast('Erreur lors de la synchronisation avec le serveur.', 'error');
      }
    }
  };

  // Charger les mises à jour provenant du serveur / Super Admin au montage
  useEffect(() => {
    const token = api.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/company/sync?companyId=${encodeURIComponent(activeCompany.id)}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && data.context) {
          const ctx = data.context;
          if (Array.isArray(ctx.modules) && ctx.modules.length > 0) {
            setModules(ctx.modules);
          }
          if (data.company?.status && data.company.status !== activeCompany.status) {
            setActiveCompany(prev => ({ ...prev, status: data.company.status, plan: data.company.plan || prev.plan }));
          }
        }
      })
      .catch(() => {});
  }, [activeCompany.id]);

  // Auto-save local + Synchronisation temps réel de TOUTES les infos du Dashboard vers le serveur IA, WhatsApp Baileys & Super Admin
  useEffect(() => {
    accountStorage.saveCompanyData(activeCompany.id, {
      customers,
      orders,
      reservations,
      calendarSlots,
      products,
      invoices,
      instructions,
      modules,
      agentsList,
      merchantPayment: {
        country: paymentCountry,
        wavePhone: merchantWavePhone,
        omPhone: merchantOmPhone,
        localThirdPhone: merchantLocalThirdPhone,
        customMethodName: merchantCustomMethodName,
        customMethodPhone: merchantCustomMethodPhone,
        autoSend: autoSendPaymentLink
      },
      company: activeCompany
    });
    setLastAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    const syncTimer = setTimeout(() => {
      pushFullDashboardSyncToServer(true);
    }, 300);

    return () => clearTimeout(syncTimer);
  }, [customers, orders, reservations, calendarSlots, products, invoices, instructions, modules, agentsList, activeCompany, knowledgeTextState, promptTextState, uploadedDocs, paymentCountry, merchantWavePhone, merchantOmPhone, merchantLocalThirdPhone, merchantCustomMethodName, merchantCustomMethodPhone, autoSendPaymentLink]);

  // Sync simulator greeting and load persisted server context when active agent changes
  useEffect(() => {
    setSimChat([
      { 
        sender: 'agent', 
        text: currentAgent.welcomeMessage, 
        time: 'À l\'instant',
        detectedRole: currentAgent.roleTitle
      }
    ]);
    setKnowledgeTextState(stripDashboardAutoSection(currentAgent.knowledgeText || ''));
    setPromptTextState(currentAgent.promptInstruction || '');

    const token = api.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/ai/context?agentId=${encodeURIComponent(currentAgent.id)}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(ctx => {
        if (ctx) {
          if (ctx.knowledgeBase) setKnowledgeTextState(stripDashboardAutoSection(ctx.knowledgeBase));
          if (ctx.customInstructions) setPromptTextState(ctx.customInstructions);
          if (Array.isArray(ctx.documents)) setUploadedDocs(ctx.documents);
        }
      })
      .catch(() => {});
  }, [selectedAgentFilter, currentAgent.id]);

  // Target Agent chosen for WhatsApp connection / disconnection
  const targetWhatsAppAgent = agentsList.find(a => a.id === selectedWhatsAppAgentId) || agentsList[0] || FALLBACK_EMPTY_AGENT;

  // Helper toast notification
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setWhatsappToast({ type, message });
    setTimeout(() => setWhatsappToast(null), 5000);
  };

  // Sync agent context (Knowledge + All Dashboard Data + Instructions + Documents) to backend so Baileys WhatsApp AI & Super Admin use it live
  const syncAgentContextToServer = async (agentId: string, knowledgeBase: string, customInstructions: string, docs = uploadedDocs) => {
    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const ag = agentsList.find(a => a.id === agentId) || currentAgent;
      const fullDashboardKnowledge = buildFullDashboardKnowledge(knowledgeBase);
      const activeStrictRules = instructions.filter(i => i.active).map(i => i.rule);

      await fetch('/api/ai/context', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          companyId: activeCompany.id,
          agentId,
          companyName: activeCompany.name,
          industry: activeCompany.industry,
          agentName: ag.name,
          roleType: ag.roleType,
          roleTitle: ag.roleTitle,
          welcomeMessage: ag.welcomeMessage,
          knowledgeBase: fullDashboardKnowledge,
          customInstructions,
          strictRules: activeStrictRules,
          documents: docs,
          products,
          orders,
          reservations,
          calendarSlots,
          invoices,
          customers,
          instructionsList: instructions,
          modules,
          agentsList
        })
      });

      await pushFullDashboardSyncToServer(true);
    } catch (err) {
      console.warn('Sync context to server error:', err);
    }
  };

  // Assimilate uploaded file or pasted document via Gemini AI
  const handleAssimilateDocument = async (title: string, rawText: string) => {
    if (!title.trim() || !rawText.trim()) {
      showToast("Veuillez renseigner un titre et un contenu de document.", 'error');
      return;
    }
    setIsAssimilatingDoc(true);
    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/assimilate-document', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentTitle: title.trim(),
          rawContent: rawText,
          agentId: currentAgent.id,
          existingKnowledge: knowledgeTextState
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextKnowledge = data.mergedKnowledge || knowledgeTextState;
        setKnowledgeTextState(nextKnowledge);
        if (Array.isArray(data.documents)) {
          setUploadedDocs(data.documents);
        }
        setAgentsList(prev => prev.map(a => a.id === currentAgent.id ? { ...a, knowledgeText: nextKnowledge } : a));
        setNewDocTitle('');
        setNewDocContent('');
        showToast(`Document "${title}" assimilé par l'IA et synchronisé avec WhatsApp (${data.summary || 'Indexé'}) !`, 'success');
      } else {
        showToast(data.error || "Erreur lors de l'assimilation du document.", 'error');
      }
    } catch (_) {
      showToast("Erreur réseau lors de l'assimilation du document par l'IA.", 'error');
    } finally {
      setIsAssimilatingDoc(false);
    }
  };

  // Handle file input upload (.txt, .md, .csv, .json, etc.)
  const handleFileUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await handleAssimilateDocument(file.name, text);
    } catch (_) {
      showToast("Impossible de lire ce fichier.", 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Apply live changes (prices, hours, rules, products) in natural language via AI
  const handleApplyLiveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveChangeDirective.trim() || isApplyingLiveChange) return;

    setIsApplyingLiveChange(true);
    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/apply-changes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          changeDirective: liveChangeDirective.trim(),
          agentId: currentAgent.id,
          currentKnowledge: knowledgeTextState,
          currentInstructions: promptTextState
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.updatedKnowledge) setKnowledgeTextState(data.updatedKnowledge);
        if (data.updatedInstructions) setPromptTextState(data.updatedInstructions);
        setAgentsList(prev => prev.map(a => a.id === currentAgent.id ? {
          ...a,
          knowledgeText: data.updatedKnowledge || a.knowledgeText,
          promptInstruction: data.updatedInstructions || a.promptInstruction
        } : a));
        setLastAppliedChangeReport({
          summaryOfChanges: data.summaryOfChanges || 'Changements intégrés avec succès.',
          appliedRules: Array.isArray(data.appliedRules) ? data.appliedRules : [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setLiveChangeDirective('');
        showToast(`Changements appliqués par l'IA et actifs immédiatement sur WhatsApp pour ${currentAgent.name} !`, 'success');
      } else {
        showToast(data.error || "Impossible d'appliquer les changements.", 'error');
      }
    } catch (_) {
      showToast("Erreur lors de l'application des changements par l'IA.", 'error');
    } finally {
      setIsApplyingLiveChange(false);
    }
  };

  // Sync waSimChat when targetWhatsAppAgent changes
  useEffect(() => {
    if (targetWhatsAppAgent) {
      setWaSimChat([
        {
          sender: 'agent',
          text: targetWhatsAppAgent.whatsappStatus === 'connected'
            ? targetWhatsAppAgent.welcomeMessage
            : `⚠️ ${targetWhatsAppAgent.name} est actuellement DÉCONNECTÉ de WhatsApp. Pour que cet agent réponde aux messages clients, scannez le QR Code Baileys ci-dessous.`,
          time: 'À l\'instant',
          detectedRole: targetWhatsAppAgent.roleTitle
        }
      ]);
    }
  }, [selectedWhatsAppAgentId, targetWhatsAppAgent?.whatsappStatus]);

  // Fetch Real Live WhatsApp QR Code & Status from Baileys Gateway (Fonction 2 : Company Agent Session)
  const fetchLiveWhatsAppStatus = async (silentOrEvent?: boolean | React.MouseEvent) => {
    const silent = silentOrEvent === true;
    if (!silent) setIsFetchingQr(true);
    try {
      const token = api.getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const activeTargetId = selectedWhatsAppAgentId || currentAgent.id;
      const agentIdParam = encodeURIComponent(activeTargetId);
      const res = await fetch(`/api/whatsapp/qr?role=company_agent&agentId=${agentIdParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const sessionMap = new Map<string, any>();
        if (Array.isArray(data.sessions)) {
          data.sessions.forEach((s: any) => {
            if (s.agentId) sessionMap.set(s.agentId, s);
          });
        }

        if (data.connected || data.status === 'connected') {
          setQrStatus('connected');
          setLiveQrImage(null);
          setConnectedPhone(data.phoneNumber || targetWhatsAppAgent?.whatsappNumber || 'Connecté');
          setAgentsList(prev => prev.map(a => {
            if (a.id === activeTargetId) {
              return {
                ...a,
                whatsappStatus: 'connected',
                whatsappNumber: data.phoneNumber || a.whatsappNumber
              };
            }
            const sess = sessionMap.get(a.id);
            if (sess) {
              return {
                ...a,
                whatsappStatus: sess.status === 'connected' ? 'connected' : 'disconnected',
                whatsappNumber: sess.phoneNumber || a.whatsappNumber
              };
            }
            return a;
          }));
        } else {
          setQrStatus(data.status || 'qr_ready');
          if (data.qrDataUrl) {
            setLiveQrImage(data.qrDataUrl);
          }
          if (data.pairingCode) setPairingCode(data.pairingCode);
          if (data.countdown) setQrRefreshCountdown(data.countdown);

          // S'assurer que l'agent sélectionné affiche bien le scanner QR s'il n'est pas connecté sur le serveur
          setAgentsList(prev => prev.map(a => {
            if (a.id === activeTargetId) {
              return { ...a, whatsappStatus: 'disconnected' };
            }
            const sess = sessionMap.get(a.id);
            if (sess) {
              return {
                ...a,
                whatsappStatus: sess.status === 'connected' ? 'connected' : 'disconnected',
                whatsappNumber: sess.phoneNumber || a.whatsappNumber
              };
            }
            return a;
          }));
        }
      }

      // Also refresh company WhatsApp conversation logs
      const logsRes = await fetch('/api/whatsapp/logs?limit=30', { headers });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (Array.isArray(logsData.logs)) {
          setWhatsappLogs(logsData.logs);
        }
      }
    } catch (e) {
      console.warn("Erreur chargement statut Baileys WhatsApp:", e);
    } finally {
      if (!silent) setIsFetchingQr(false);
    }
  };

  // Request Real 8-character Baileys Pairing Code for the selected AI agent
  const handleRequestBaileysPairingCode = async () => {
    const phoneToUse = pairingPhoneInput.trim() || targetWhatsAppAgent?.whatsappNumber || '';
    if (!phoneToUse) {
      showToast("Veuillez saisir votre numéro WhatsApp au format international (ex: +221 77...).", 'error');
      return;
    }
    setIsRequestingPairingCode(true);
    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/whatsapp/pairing-code', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phoneNumber: phoneToUse,
          agentId: targetWhatsAppAgent.id,
          role: 'company_agent'
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.pairingCode) {
        setPairingCode(data.pairingCode);
        showToast(`Code d'appairage Baileys généré : ${data.pairingCode}`, 'success');
      } else {
        showToast(data.error || "Impossible d'obtenir le code d'appairage. Utilisez le scan QR Code.", 'error');
      }
    } catch (_) {
      showToast("Erreur réseau avec le serveur Baileys.", 'error');
    } finally {
      setIsRequestingPairingCode(false);
    }
  };

  // Synchronisation automatique en temps réel (toutes les 2.5s) pour que le QR code soit toujours valide
  // et que le scan depuis le téléphone soit détecté instantanément sans clic manuel
  useEffect(() => {
    fetchLiveWhatsAppStatus(false);
    const fastInterval = setInterval(() => {
      if (currentTab === 'whatsapp' || showWhatsAppWebModal || showQrModal) {
        fetchLiveWhatsAppStatus(true);
      }
    }, 2500);
    return () => clearInterval(fastInterval);
  }, [selectedWhatsAppAgentId, currentTab, showWhatsAppWebModal, showQrModal]);

  // Décompte visuel de rafraîchissement du QR Code
  useEffect(() => {
    const timer = setInterval(() => {
      setQrRefreshCountdown(prev => (prev <= 1 ? 20 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedWhatsAppAgentId]);

  // Handler to start scanner for a specific IA
  const handleStartScanForAgent = async (agentId: string) => {
    setSelectedWhatsAppAgentId(agentId);
    setAgentsList(prev => prev.map(a => a.id === agentId ? { ...a, whatsappStatus: 'disconnected' } : a));
    await fetchLiveWhatsAppStatus(false);
  };

  // Handler to check / confirm QR scan pairing for an IA and sync its context to Baileys
  const handleConfirmScan = async (agentId: string) => {
    const ag = agentsList.find(a => a.id === agentId);
    if (!ag) return;
    setIsScanningWhatsApp(true);
    setScanningProgress(40);

    await syncAgentContextToServer(
      ag.id,
      ag.id === currentAgent.id ? knowledgeTextState : (ag.knowledgeText || ''),
      ag.id === currentAgent.id ? promptTextState : (ag.promptInstruction || '')
    );

    try {
      const token = api.getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/whatsapp/qr?role=company_agent&agentId=${encodeURIComponent(agentId)}`, { headers });
      const data = res.ok ? await res.json() : null;

      setScanningProgress(100);
      setIsScanningWhatsApp(false);

      if (data && (data.connected || data.status === 'connected')) {
        setQrStatus('connected');
        setLiveQrImage(null);
        setAgentsList(prev => prev.map(a => a.id === agentId ? {
          ...a,
          whatsappStatus: 'connected',
          whatsappNumber: data.phoneNumber || a.whatsappNumber
        } : a));
        setShowWhatsAppWebModal(false);
        setShowQrModal(false);
        showToast(`✅ L'agent IA "${ag.name}" est connecté à WhatsApp (${data.phoneNumber || 'Actif'}) et synchronisé !`, 'success');
      } else {
        if (data?.qrDataUrl) setLiveQrImage(data.qrDataUrl);
        showToast(`Le QR Code est prêt : ouvrez WhatsApp sur votre téléphone > Appareils connectés > Connecter un appareil et scannez le code à l'écran.`, 'info');
      }
    } catch (_) {
      setIsScanningWhatsApp(false);
    }
  };

  // Handler to disconnect an IA from WhatsApp Baileys server & generate fresh QR
  const handleDisconnectWhatsAppAgent = async (agentId: string) => {
    const ag = agentsList.find(a => a.id === agentId);
    if (!ag) return;
    setIsFetchingQr(true);
    setLiveQrImage(null);
    setAgentsList(prev => prev.map(a => a.id === agentId ? { ...a, whatsappStatus: 'disconnected' } : a));
    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/whatsapp/reset', {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: 'company_agent', agentId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.qrDataUrl) {
          setLiveQrImage(data.qrDataUrl);
          setQrStatus('qr_ready');
        }
      }
    } catch (_) {}
    setIsFetchingQr(false);
    setIsScanningWhatsApp(false);
    showToast(`Session Baileys de "${ag.name}" réinitialisée. Nouveau QR Code prêt à être scanné.`, 'info');
  };

  // Handler to update an agent's assigned WhatsApp phone number
  const handleUpdateAgentPhone = (agentId: string, phone: string) => {
    setAgentsList(prev => prev.map(a => a.id === agentId ? { ...a, whatsappNumber: phone } : a));
    setPairingPhoneInput(phone);
    showToast(`Numéro WhatsApp mis à jour pour l'agent : ${phone}`, 'success');
  };

  // Handler for sending simulated test WhatsApp messages to the selected agent
  const handleSendWaSimMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waSimInput.trim() || isWaSimLoading || !targetWhatsAppAgent) return;

    const userText = waSimInput.trim();
    setWaSimInput('');

    if (targetWhatsAppAgent.whatsappStatus !== 'connected') {
      setWaSimChat(prev => [
        ...prev,
        { sender: 'user', text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        { 
          sender: 'agent', 
          text: `⚠️ [Avertissement Passerelle] : L'agent "${targetWhatsAppAgent.name}" est déconnecté de WhatsApp. Le message n'a pas pu être traité. Scannez le QR Code pour le relier.`, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          detectedRole: 'Passerelle WhatsApp'
        }
      ]);
      return;
    }

    setWaSimChat(prev => [
      ...prev,
      { sender: 'user', text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setIsWaSimLoading(true);

    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userText,
          sender: 'whatsapp-test-sim',
          companyId: activeCompany.id,
          agentId: targetWhatsAppAgent.id,
          agentName: targetWhatsAppAgent.name,
          roleType: targetWhatsAppAgent.roleType,
          instructions: targetWhatsAppAgent.promptInstruction,
          knowledgeText: buildFullDashboardKnowledge(targetWhatsAppAgent.knowledgeText)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setWaSimChat(prev => [
          ...prev,
          { 
            sender: 'agent', 
            text: data.reply, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            detectedRole: targetWhatsAppAgent.roleTitle
          }
        ]);
      } else {
        // Fallback respecting role
        let reply = `Bonjour ! Je suis ${targetWhatsAppAgent.name} pour ${activeCompany.name}.`;
        if (targetWhatsAppAgent.roleType === 'customer_service') {
          reply = `Bonjour ! Je suis le Service Client de ${activeCompany.name}. Pour les commandes ou achats, je vous transfère au pôle Ventes !`;
        } else if (targetWhatsAppAgent.roleType === 'sales_orders') {
          reply = `Bonjour ! Je suis votre conseillère Ventes chez ${activeCompany.name}. Comment puis-je enregistrer votre commande ?`;
        }
        setWaSimChat(prev => [
          ...prev,
          { 
            sender: 'agent', 
            text: reply, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            detectedRole: targetWhatsAppAgent.roleTitle
          }
        ]);
      }
    } catch (e) {
      setWaSimChat(prev => [
        ...prev,
        { 
          sender: 'agent', 
          text: `Bonjour ! Bien reçu. ${targetWhatsAppAgent.name} est disponible pour répondre à vos questions en tant que ${targetWhatsAppAgent.roleTitle}.`, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          detectedRole: targetWhatsAppAgent.roleTitle
        }
      ]);
    } finally {
      setIsWaSimLoading(false);
    }
  };

  // Strict Role AI Simulator handler
  const handleSendSim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim() || isSimLoading) return;

    const userText = simInput.trim();
    setSimInput('');

    // Pre-detect intent client-side for immediate visual badge
    const lower = userText.toLowerCase();
    let detectedType = 'Question générale';
    if (lower.includes('command') || lower.includes('acheter') || lower.includes('prix') || lower.includes('payer')) {
      detectedType = 'Intention d\'Achat / Commande';
    } else if (lower.includes('table') || lower.includes('réserv') || lower.includes('rdv') || lower.includes('créneau')) {
      detectedType = 'Demande de Réservation';
    } else if (lower.includes('problème') || lower.includes('réclamation') || lower.includes('panne') || lower.includes('sav')) {
      detectedType = 'Réclamation / Support SAV';
    }
    setDetectedIntent(detectedType);

    setSimChat(prev => [
      ...prev, 
      { sender: 'user', text: userText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setIsSimLoading(true);

    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userText,
          sender: 'simulator',
          companyId: activeCompany.id,
          agentId: currentAgent.id,
          agentName: currentAgent.name,
          roleType: currentAgent.roleType,
          instructions: promptTextState || currentAgent.promptInstruction,
          knowledgeText: buildFullDashboardKnowledge(knowledgeTextState || currentAgent.knowledgeText)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimChat(prev => [
          ...prev, 
          { 
            sender: 'agent', 
            text: data.reply, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            detectedRole: currentAgent.roleTitle
          }
        ]);
      } else {
        // Fallback respecting role strictness
        let reply = `Bonjour ! Je suis ${currentAgent.name} pour ${activeCompany.name}.`;
        if (currentAgent.roleType === 'customer_service' && (detectedType.includes('Commande') || detectedType.includes('Réservation'))) {
          reply = `Bonjour ! En tant qu'agent dédié au Service Client, je ne prends pas les commandes ni les réservations en direct. Je vous invite à vous adresser à notre pôle Ventes ou je transmets votre contact !`;
        } else if (currentAgent.roleType === 'sales_orders' && detectedType.includes('Réclamation')) {
          reply = `Bonjour ! En tant que responsable Ventes, je traite vos achats et le catalogue. Pour votre réclamation, notre Service Client dédié (${activeCompany.phone || 'interne'}) vous répondra avec priorité.`;
        }
        setSimChat(prev => [
          ...prev, 
          { 
            sender: 'agent', 
            text: reply, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            detectedRole: currentAgent.roleTitle
          }
        ]);
      }
    } catch (e) {
      setSimChat(prev => [
        ...prev, 
        { 
          sender: 'agent', 
          text: `Bonjour ! Bien reçu. En tant qu'agent ${currentAgent.roleTitle}, je traite votre message conformément à mes attributions.`, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          detectedRole: currentAgent.roleTitle
        }
      ]);
    } finally {
      setIsSimLoading(false);
    }
  };

  // Guide prompt copilot chat handler
  const handleSendGuidePromptChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guideInput.trim() || isGuideLoading) return;

    const userText = guideInput.trim();
    setGuideInput('');
    const newHistory = [...guideChat, { role: 'user' as const, text: userText }];
    setGuideChat(newHistory);
    setIsGuideLoading(true);

    try {
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/guide-prompt', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation: newHistory,
          agentRole: currentAgent.roleTitle,
          companyName: activeCompany.name,
          currentPrompt: promptTextState
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGuideChat(prev => [...prev, { role: 'assistant', text: data.reply }]);
        if (data.suggestedPrompt) {
          setPromptTextState(data.suggestedPrompt);
        }
      } else {
        setGuideChat(prev => [
          ...prev, 
          { role: 'assistant', text: `Parfaitement compris ! Ces instructions ont été intégrées pour renforcer la spécificité de ${currentAgent.name}.` }
        ]);
      }
    } catch (e) {
      setGuideChat(prev => [
        ...prev, 
        { role: 'assistant', text: `C'est bien noté. Vos consignes pour ${currentAgent.name} sont prises en compte.` }
      ]);
    } finally {
      setIsGuideLoading(false);
    }
  };

  // Handle agent creation from the 7-step wizard
  const handleAgentCreated = (newAgent: EnterpriseAgent, updatedComp?: Partial<CompanyProfile>) => {
    setAgentsList(prev => [newAgent, ...prev]);
    setSelectedAgentFilter(newAgent.id);
    if (updatedComp) {
      setActiveCompany(prev => ({ ...prev, ...updatedComp }));
    }
    setShowWizardModal(false);
    setCurrentTab('whatsapp'); // Jump to the most important connection page!
  };

  // Coordinated metric calculations (strictement basés sur les vraies données)
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalConversations = whatsappLogs.length;
  const creditsUsed = activeCompany.creditsUsed || 0;
  const creditsLimit = companyCreditsLimit;
  const creditsRemaining = Math.max(0, creditsLimit - creditsUsed);

  // Filtered conversations by selected agent
  const displayedLogs = selectedAgentFilter === 'all'
    ? whatsappLogs
    : whatsappLogs.filter((l: any) => l.agent_id === selectedAgentFilter || l.role === currentAgent.roleType);

  // SIMPLIFIED NAVIGATION: Based strictly on the creation steps + core operations
  const navItems = [
    { id: 'overview' as DashboardTab, label: 'Tableau de bord', shortLabel: 'Aperçu', icon: LayoutDashboard },
    { id: 'agents' as DashboardTab, label: 'Mes Agents IA & Créateur', shortLabel: 'Agents IA', icon: Bot, count: agentsList.length },
    { id: 'whatsapp' as DashboardTab, label: 'Connexion WhatsApp', shortLabel: 'WhatsApp', icon: Smartphone, highlight: true },
    { id: 'operations' as DashboardTab, label: 'Opérations Commerciales', shortLabel: 'Opérations', icon: ShoppingBag, count: orders.length + reservations.length },
    { id: 'knowledge' as DashboardTab, label: 'Base de Connaissances', shortLabel: 'Documents', icon: FileText },
    { id: 'instructions' as DashboardTab, label: 'Instructions & Prompts', shortLabel: 'Prompts', icon: Sliders },
    { id: 'conversations' as DashboardTab, label: 'Conversations WhatsApp', shortLabel: 'Chats WA', icon: MessageSquare, count: totalConversations },
    { id: 'billing' as DashboardTab, label: 'Facturation & PayDunya', shortLabel: 'Factures', icon: CreditCard },
    { id: 'company_profile' as DashboardTab, label: 'Entreprise & Responsable', shortLabel: 'Entreprise', icon: Building2 }
  ];

  return (
    <div className="h-screen flex-1 min-h-0 overflow-hidden bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row relative">
      
      {/* Clean Single-Row Mobile Top Bar (Visible only on < md) */}
      <div className="md:hidden bg-white border-b border-slate-200 shrink-0 z-30">
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC] font-extrabold text-xs shrink-0">
              {activeCompany.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-extrabold text-[#0A0A0A] truncate" title={activeCompany.name}>
                {activeCompany.name}
              </h2>
              <span className="text-[10px] text-slate-500 font-semibold block truncate">
                {navItems.find((n) => n.id === currentTab)?.label || 'Tableau de bord'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onViewLanding && (
              <button
                type="button"
                onClick={onViewLanding}
                className="px-2.5 py-1.5 rounded-full bg-[#F8FAFC] border border-slate-200 text-slate-700 text-[11px] font-extrabold cursor-pointer"
              >
                ← Site
              </button>
            )}
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

      {/* Sidebar - Drawer on Mobile, Fixed on Desktop */}
      <aside className={`${
        mobileSidebarOpen ? 'fixed inset-y-0 left-0 w-72 z-50 flex shadow-2xl' : 'hidden'
      } md:static md:flex md:w-64 md:h-full bg-white border-r border-slate-200 flex-col shrink-0 z-20`}>
        
        {/* Company profile badge */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC] font-extrabold text-sm">
              {activeCompany.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-[#0A0A0A] truncate max-w-[110px]" title={activeCompany.name}>
                {activeCompany.name}
              </h2>
              <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[110px]">
                {agentsList.length} IA active{agentsList.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
              isPlan125kOrMore ? 'text-[#0052CC] bg-[#EBF2FF]' : 'text-emerald-700 bg-emerald-50'
            }`}>
              {isPlan125kOrMore ? '125K+ MULTI-IA' : (activePlan || 'PRO').toUpperCase()}
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

        {/* Quick Launch CTA: Créer un Agent IA (6 étapes) */}
        <div className="p-3 border-b border-slate-100">
          <button
            onClick={() => {
              setShowWizardModal(true);
              setMobileSidebarOpen(false);
            }}
            className="w-full py-2.5 px-3 rounded-full bg-[#0052CC] hover:bg-[#003E99] text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Agent IA (6 étapes)</span>
          </button>
        </div>

        {/* Simplified Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || 
              (item.id === 'operations' && ['clients', 'orders', 'reservations', 'calendar', 'products', 'invoices'].includes(currentTab)) ||
              (item.id === 'agents' && currentTab === 'agent') ||
              (item.id === 'whatsapp' && currentTab === 'settings');

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#0052CC] text-white shadow-xs' 
                    : item.highlight 
                    ? 'text-emerald-800 hover:bg-emerald-50/70' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-500'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {onViewLanding && (
            <button
              onClick={onViewLanding}
              className="w-full py-2 rounded-xl neu-btn text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🌐 Voir le Site Public</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full py-2 rounded-xl neu-btn text-rose-700 hover:text-rose-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area - Seule cette partie défile verticalement */}
      <main className="flex-1 md:h-full min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-4 sm:space-y-6">
        
        {/* Structured Top Header & Action Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 font-display">
                  {navItems.find(n => n.id === currentTab)?.label || 'Tableau de bord'}
                </h1>
                {isVipFreeUser && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold inline-flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>VIP Illimité ✓</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                Espace de {activeCompany.name} • Coffre privé : {activeCompany.dataSpaceId}
              </p>
            </div>

            {/* Agent Filter Selector */}
            {isPlan125kOrMore ? (
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80">
                <div className="flex items-center gap-1.5 pl-2 text-indigo-900 font-extrabold text-[11px] shrink-0">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Agent :</span>
                </div>
                <select
                  value={selectedAgentFilter}
                  onChange={(e) => setSelectedAgentFilter(e.target.value)}
                  className="neu-input rounded-lg px-2.5 py-1 text-xs text-indigo-950 font-bold bg-white cursor-pointer flex-1 min-w-0"
                >
                  <option value="all">Tous les Agents ({agentsList.length})</option>
                  {agentsList.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} • {a.roleTitle}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-medium">Multi-Agents (≥ 125 000 FCFA)</span>
                </div>
                <button
                  onClick={() => setPaytechModalData({
                    itemName: 'Abonnement ENTREPRISE MULTI-AGENTS',
                    itemPriceFCFA: 125000,
                    itemPriceEUR: 190,
                    planId: 'enterprise_125k',
                    creditsAdded: 60000
                  })}
                  className="neu-btn px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-indigo-800 hover:text-indigo-950 cursor-pointer shrink-0"
                >
                  Débloquer
                </button>
              </div>
            )}
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-200/60">
            <button
              type="button"
              onClick={() => setShowWizardModal(true)}
              className="p-2 sm:px-3.5 sm:py-2 rounded-xl neu-btn-primary text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Nouvelle IA</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW (Vue d'ensemble) */}
        {currentTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Active Agent Context Indicator if filtered */}
            {selectedAgentFilter !== 'all' && (
              <div className="p-3.5 rounded-2xl neu-pressed bg-indigo-50/50 border border-indigo-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-indigo-950">
                    Vue filtrée pour : <strong className="font-extrabold">{currentAgent.name}</strong> ({currentAgent.roleTitle})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAgentFilter('all')}
                  className="text-[11px] text-indigo-700 underline font-semibold hover:text-indigo-900 cursor-pointer"
                >
                  Afficher tous les agents
                </button>
              </div>
            )}

            {/* Structured KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl neu-flat space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Conversations WhatsApp</span>
                <span className="text-2xl font-extrabold font-mono text-sky-800 block">
                  {selectedAgentFilter === 'all' ? totalConversations : (currentAgent.conversationsCount || 0)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {totalConversations > 0 ? 'Échanges enregistrés' : 'Aucune conversation'}
                </span>
              </div>
              <div className="p-4 rounded-3xl neu-flat space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Agents IA Créés</span>
                <span className="text-2xl font-extrabold font-mono text-indigo-700 block">{agentsList.length}</span>
                <span className="text-[10px] text-slate-500">
                  {agentsList.length > 0 ? `${agentsList.length} agent(s) configuré(s)` : 'Aucun agent créé'}
                </span>
              </div>
              <div className="p-4 rounded-3xl neu-flat space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Commandes & Ventes</span>
                <span className="text-2xl font-extrabold font-mono text-emerald-700 block">{orders.length}</span>
                <span className="text-[10px] text-slate-500">Volume : {totalRevenue.toLocaleString()} FCFA</span>
              </div>
              <div className="p-4 rounded-3xl neu-flat space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Crédits mensuels restants</span>
                <span className="text-2xl font-extrabold font-mono text-slate-800 block">{creditsRemaining.toLocaleString()}</span>
                <span className="text-[10px] text-slate-500">Sur {creditsLimit.toLocaleString()} disponibles</span>
              </div>
            </div>

            {/* Quick Status Bar for WhatsApp Direct Connection */}
            <div className="p-5 rounded-3xl neu-flat flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-300/60 bg-emerald-50/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl neu-pressed flex items-center justify-center text-emerald-600 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Passerelle WhatsApp Baileys Directe : {qrStatus === 'connected' && connectedPhone ? connectedPhone : 'Aucun numéro connecté'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {qrStatus === 'connected' && connectedPhone
                      ? `Statut connecté ✓ • Temporisation de réponse : ${responseLatency}s.`
                      : 'Statut déconnecté • Scannez le QR code dans l\'onglet Connexion WhatsApp pour relier un numéro.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentTab('whatsapp')}
                className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Gérer la liaison WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simulator Console with Strict Role Enforcement */}
            <div className="p-6 rounded-3xl neu-flat border border-white/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D1D9E6] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl neu-pressed flex items-center justify-center text-sky-600">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Console Conversationnelle : {currentAgent.name} ({currentAgent.roleTitle})
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Échangez en direct avec votre agent configuré. Il applique ses directives et refuse les demandes hors de son rôle.
                    </p>
                  </div>
                </div>
                {detectedIntent && (
                  <span className="neu-pill px-2.5 py-1 text-[10px] font-mono font-bold text-sky-800">
                    Détection : {detectedIntent}
                  </span>
                )}
              </div>

              {/* Chat Viewport */}
              <div className="h-60 overflow-y-auto space-y-3 p-3 neu-pressed rounded-2xl">
                {simChat.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium space-y-1 ${
                      m.sender === 'user' ? 'neu-btn-primary text-white' : 'bg-white text-slate-800 shadow-xs'
                    }`}>
                      {m.detectedRole && m.sender === 'agent' && (
                        <span className="text-[9px] font-bold text-sky-700 block uppercase">
                          {m.detectedRole}
                        </span>
                      )}
                      <p>{m.text}</p>
                      <span className="text-[9px] opacity-70 block text-right mt-1">{m.time}</span>
                    </div>
                  </div>
                ))}
                {isSimLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    <span>L'IA analyse le type de demande selon son rôle ({currentAgent.roleTitle})...</span>
                  </div>
                )}
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-500">Suggestions rapides :</span>
                <button
                  type="button"
                  onClick={() => setSimInput("Je souhaite passer une commande de 2 articles.")}
                  className="neu-btn px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-700 cursor-pointer"
                >
                  Nouvelle commande
                </button>
                <button
                  type="button"
                  onClick={() => setSimInput("Avez-vous une table pour ce soir à 20h ?")}
                  className="neu-btn px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-700 cursor-pointer"
                >
                  Demande de réservation
                </button>
                <button
                  type="button"
                  onClick={() => setSimInput("Mon colis a du retard, je veux faire une réclamation.")}
                  className="neu-btn px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-700 cursor-pointer"
                >
                  Suivi / SAV
                </button>
              </div>

              <form onSubmit={handleSendSim} className="flex gap-2">
                <input
                  type="text"
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  placeholder={`Posez une question à ${currentAgent.name} (${currentAgent.roleTitle})...`}
                  className="flex-1 neu-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 bg-transparent"
                />
                <button
                  type="submit"
                  disabled={isSimLoading || !simInput.trim()}
                  className="neu-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: MES AGENTS IA & CRÉATEUR */}
        {currentTab === 'agents' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl neu-flat border border-white/80">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Mes Agents IA Configurés ({agentsList.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Chaque agent a une mission précise et stricte pour garantir des réponses expertes sans dérives.
                </p>
              </div>
              <button
                onClick={() => setShowWizardModal(true)}
                className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Créer une nouvelle IA (6 étapes)</span>
              </button>
            </div>

            {agentsList.length === 0 ? (
              <div className="p-8 rounded-3xl neu-pressed text-center space-y-3">
                <Bot className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-sm font-extrabold text-slate-800">Aucun agent IA créé pour le moment</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Cliquez sur le bouton ci-dessus pour créer votre premier agent IA personnalisé.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {agentsList.map((agent) => {
                  const isSelected = selectedAgentFilter === agent.id;
                  return (
                    <div
                      key={agent.id}
                      className={`p-6 rounded-3xl transition-all flex flex-col justify-between space-y-4 border ${
                        isSelected 
                          ? 'neu-pressed border-sky-400 bg-sky-50/30 ring-2 ring-sky-500/50' 
                          : 'neu-flat border-white/80'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-2xl neu-flat flex items-center justify-center text-sky-700 font-extrabold text-sm">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full neu-pill text-[10px] font-bold text-emerald-800">
                              {agent.status === 'active' ? 'Actif' : 'En pause'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAgentsList(prev => prev.filter(a => a.id !== agent.id));
                                if (selectedAgentFilter === agent.id) setSelectedAgentFilter('all');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Supprimer cet agent IA"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">{agent.name}</h4>
                          <span className="text-xs font-bold text-sky-800 font-mono block mt-0.5">
                            {agent.roleTitle}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          {agent.description}
                        </p>

                        <div className="p-3 rounded-2xl neu-pressed text-[11px] text-slate-700 space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Numéro WhatsApp</span>
                          <span className="font-mono font-bold text-emerald-800 block">{agent.whatsappNumber || 'Non renseigné'}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#D1D9E6] flex items-center justify-between">
                        <button
                          onClick={() => {
                            setSelectedAgentFilter(agent.id);
                            setCurrentTab('overview');
                          }}
                          className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 hover:text-sky-800 cursor-pointer"
                        >
                          Ouvrir dans la console
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAgentFilter(agent.id);
                            setCurrentTab('instructions');
                          }}
                          className="text-xs font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
                        >
                          Modifier le prompt &gt;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONNEXION AVEC WHATSAPP (LA PLUS IMPORTANTE) */}
        {currentTab === 'whatsapp' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Toast feedback banner */}
            {whatsappToast && (
              <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-fadeIn shadow-md ${
                whatsappToast.type === 'success' 
                  ? 'bg-emerald-600 text-white' 
                  : whatsappToast.type === 'error'
                  ? 'bg-rose-600 text-white'
                  : 'bg-sky-600 text-white'
              }`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{whatsappToast.message}</span>
                </div>
                <button 
                  onClick={() => setWhatsappToast(null)} 
                  className="opacity-80 hover:opacity-100 cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* TOP HEADER */}
            <div className="p-6 sm:p-8 rounded-3xl neu-flat border border-white/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D9E6] pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-emerald-600 shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-extrabold text-slate-900 font-display">
                        Passerelle WhatsApp & Scanner Multi-Agents
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        BAILEYS MULTI-APPAREILS
                      </span>
                      {isPlan125kOrMore && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                          MULTI-IA SIMULTANÉ DÉBLOQUÉ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Choisissez quelle IA connecter ou déconnecter de WhatsApp en temps réel grâce au scanner QR code ci-dessous.
                    </p>
                  </div>
                </div>

              </div>

              {whatsappSubView === 'servers' ? (
                <WhatsAppServerConsole />
              ) : (
                <>
                  {/* STEP 1: SELECTEUR D'IA A CONNECTER / DECONNECTER */}
                  <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-sky-600" />
                    <span>Sélectionnez l'Agent IA à connecter ou déconnecter :</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Cliquez sur une IA pour afficher son scanner et gérer son statut WhatsApp
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {agentsList.map((agent) => {
                    const isSelected = selectedWhatsAppAgentId === agent.id;
                    const isConnected = agent.whatsappStatus === 'connected';

                    return (
                      <div
                        key={agent.id}
                        onClick={() => setSelectedWhatsAppAgentId(agent.id)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between space-y-3 ${
                          isSelected
                            ? 'neu-pressed border-emerald-500/80 bg-emerald-50/30 ring-2 ring-emerald-500/50'
                            : 'neu-flat border-white/80 hover:bg-white/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl neu-flat flex items-center justify-center font-bold text-xs ${
                              isConnected ? 'text-emerald-700 bg-emerald-100/50' : 'text-slate-500'
                            }`}>
                              <Bot className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900">{agent.name}</h4>
                              <span className="text-[10px] text-sky-800 font-bold block">{agent.roleTitle}</span>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 ${
                            isConnected 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            {isConnected ? 'Connecté' : 'Déconnecté'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 bg-[#ECF0F3] p-2 rounded-xl neu-pressed flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Numéro :</span>
                          <span className="font-mono font-bold text-slate-800">{agent.whatsappNumber || 'Non relié'}</span>
                        </div>

                        {/* Direct Action: Connect or Disconnect for this IA */}
                        <div className="pt-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {isConnected ? (
                            <button
                              type="button"
                              onClick={() => handleDisconnectWhatsAppAgent(agent.id)}
                              className="w-full py-1.5 px-3 rounded-xl neu-btn text-rose-700 hover:text-rose-900 hover:bg-rose-50 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Déconnecter cette IA
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartScanForAgent(agent.id)}
                              className="w-full py-1.5 px-3 rounded-xl neu-btn-primary text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                            >
                              <QrCode className="w-3 h-3" />
                              <span>Connecter via Scanner</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: POSTE DE CONNEXION ET SCANNER DE L'IA SÉLECTIONNÉE */}
              <div className="p-6 rounded-3xl neu-flat bg-white/40 border border-emerald-300/40 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D9E6] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                        Agent sélectionné
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900">
                        {targetWhatsAppAgent.name} • {targetWhatsAppAgent.roleTitle}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      Rôle strict : {targetWhatsAppAgent.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                      targetWhatsAppAgent.whatsappStatus === 'connected'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        targetWhatsAppAgent.whatsappStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`} />
                      {targetWhatsAppAgent.whatsappStatus === 'connected' 
                        ? '🟢 Connecté à WhatsApp' 
                        : '⚪ Déconnecté (Prêt à scanner)'}
                    </span>
                  </div>
                </div>

                {/* Main Visual: Scanner OR Connected State */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Left Column: Instructions & Custom Phone Number */}
                  <div className="lg:col-span-7 space-y-4">
                    {targetWhatsAppAgent.whatsappStatus === 'connected' ? (
                      <div className="p-5 rounded-2xl neu-pressed bg-emerald-50/50 border border-emerald-300/60 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>Passerelle WhatsApp Active & Synchronisée</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          L'agent <strong>{targetWhatsAppAgent.name}</strong> est actuellement relié à WhatsApp sur le numéro{' '}
                          <span className="font-mono font-bold text-emerald-800">{targetWhatsAppAgent.whatsappNumber}</span>.
                          Il répond automatiquement aux messages entrants 24h/24 selon sa spécialité (<strong>{targetWhatsAppAgent.roleTitle}</strong>).
                        </p>
                        
                        <div className="pt-2 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleDisconnectWhatsAppAgent(targetWhatsAppAgent.id)}
                            className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-50 cursor-pointer"
                          >
                            🔌 Déconnecter {targetWhatsAppAgent.name} de WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartScanForAgent(targetWhatsAppAgent.id)}
                            className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Changer de numéro / Scanner à nouveau</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl neu-pressed bg-amber-50/40 border border-amber-200 text-xs text-amber-950 space-y-2">
                          <div className="flex items-center gap-2 font-extrabold text-amber-900">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>L'agent "{targetWhatsAppAgent.name}" est déconnecté</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            Pour activer la réponse automatique aux clients sur WhatsApp pour cet agent, scannez le QR code ci-contre avec votre application WhatsApp.
                          </p>
                        </div>

                        {/* Scanner Steps */}
                        <div className="space-y-2 text-xs text-slate-700">
                          <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            <span>Procédure de scan rapide (30 secondes) :</span>
                          </h5>
                          <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 pl-1">
                            <li>Ouvrez l'application <strong>WhatsApp</strong> sur votre smartphone.</li>
                            <li>Accédez aux <strong>Réglages</strong> (iOS) ou au menu <strong>⋮</strong> (Android).</li>
                            <li>Sélectionnez <strong>« Appareils connectés »</strong> puis <strong>« Connecter un appareil »</strong>.</li>
                            <li>Dirigez l'appareil photo vers le code QR ci-contre pour valider la synchronisation.</li>
                          </ol>
                        </div>

                        {/* Assigned Phone Number Editor */}
                        <div className="p-3.5 rounded-2xl neu-flat space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Numéro WhatsApp attribué à {targetWhatsAppAgent.name} :
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={targetWhatsAppAgent.whatsappNumber || ''}
                              onChange={(e) => handleUpdateAgentPhone(targetWhatsAppAgent.id, e.target.value)}
                              className="flex-1 neu-input rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 bg-transparent"
                              placeholder="Saisissez votre numéro WhatsApp"
                            />
                            <span className="text-[10px] text-slate-400 self-center">Enregistrement auto</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: The High-Contrast Unobstructed QR Scanner Frame */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
                    <div className="relative p-3 rounded-3xl bg-white shadow-md border-2 border-emerald-400/50 w-72 h-72 flex flex-col items-center justify-center overflow-hidden">
                      {targetWhatsAppAgent.whatsappStatus === 'connected' && !isScanningWhatsApp ? (
                        <div className="text-center space-y-2 p-4 animate-fadeIn">
                          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
                          <h5 className="text-sm font-extrabold text-slate-900">IA Connectée !</h5>
                          <span className="text-xs font-mono font-bold text-emerald-700 block">
                            {targetWhatsAppAgent.whatsappNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Session Baileys Active 24/7</span>
                        </div>
                      ) : (
                        <>
                          {/* Real Unobstructed WhatsApp QR Code Matrix */}
                          {linkMode === 'qr' ? (
                            <div className="w-60 h-60 bg-white p-1 rounded-2xl flex flex-col items-center justify-center relative">
                              {liveQrImage ? (
                                <img 
                                  src={liveQrImage} 
                                  alt="Véritable Code QR WhatsApp Multi-Appareils" 
                                  className="w-full h-full object-contain select-none"
                                  style={{ imageRendering: 'pixelated' }}
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center p-4 text-center">
                                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                                  <span className="text-[11px] font-bold text-slate-700">Génération du QR Code Baileys...</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-60 bg-slate-900 p-3.5 rounded-2xl flex flex-col items-center justify-center text-white text-center space-y-2.5">
                              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                Jumelage Baileys par Numéro
                              </span>
                              <div className="flex w-full gap-1">
                                <input
                                  type="text"
                                  value={pairingPhoneInput}
                                  onChange={(e) => setPairingPhoneInput(e.target.value)}
                                  placeholder="+221 77..."
                                  className="w-full px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-mono text-white"
                                />
                                <button
                                  type="button"
                                  onClick={handleRequestBaileysPairingCode}
                                  disabled={isRequestingPairingCode}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white shrink-0 cursor-pointer"
                                >
                                  {isRequestingPairingCode ? '...' : 'Code'}
                                </button>
                              </div>
                              <div className="p-2 bg-white/10 rounded-xl font-mono text-base font-extrabold tracking-widest text-emerald-400 border border-emerald-500/40 w-full">
                                {pairingCode}
                              </div>
                              <p className="text-[9px] text-slate-300 leading-tight">
                                WhatsApp &gt; Appareils connectés &gt; Lier avec un numéro.
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => setLinkMode(linkMode === 'qr' ? 'code' : 'qr')}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                            >
                              {linkMode === 'qr' ? '👉 Lier avec un code par téléphone' : '👈 Revenir au scan QR code'}
                            </button>
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Auto : {qrRefreshCountdown}s
                            </span>
                          </div>
                        </>
                      )}

                      {/* Scanning progress overlay if scanning */}
                      {isScanningWhatsApp && (
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white z-20 space-y-3">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                          <span className="text-xs font-bold text-center">
                            Vérification de la connexion WhatsApp pour {targetWhatsAppAgent.name}...
                          </span>
                          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300"
                              style={{ width: `${scanningProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scanner action trigger button */}
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      {targetWhatsAppAgent.whatsappStatus !== 'connected' ? (
                        <button
                          type="button"
                          onClick={() => setShowWhatsAppWebModal(true)}
                          className="w-full py-2.5 px-4 rounded-2xl neu-btn-primary text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-102 transition-transform"
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>Agrandir le QR Code ({targetWhatsAppAgent.name})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDisconnectWhatsAppAgent(targetWhatsAppAgent.id)}
                          className="w-full py-2 px-4 rounded-2xl neu-btn text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer"
                        >
                          Déconnecter {targetWhatsAppAgent.name}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDisconnectWhatsAppAgent(targetWhatsAppAgent.id)}
                        className="text-[11px] font-bold text-slate-600 hover:text-sky-800 flex items-center justify-center gap-1 cursor-pointer py-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${isFetchingQr ? 'animate-spin text-sky-600' : ''}`} />
                        <span>Générer un nouveau QR Code</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* ROLE ISOLATION NOTICE */}
                <div className="p-4 rounded-2xl neu-pressed bg-indigo-50/40 border border-indigo-200 text-xs text-indigo-950 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <strong className="block text-indigo-900">
                      Cloisonnement strict des réponses par rôle WhatsApp :
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Chaque agent connecté à WhatsApp applique strictement ses directives. Par exemple, l'agent <strong>Service Client</strong> ne prend pas de commande et réoriente le client avec courtoisie. L'agent <strong>Commandes & Ventes</strong> présente le catalogue et les liens Wave / Orange Money.
                    </span>
                  </div>
                </div>

              </div>

              {/* STEP 3: CONSOLE D'ÉCHANGE WHATSAPP EN DIRECT POUR L'IA CHOISIE */}
              <div className="p-6 rounded-3xl neu-flat border border-white/80 space-y-4">
                <div className="flex items-center justify-between border-b border-[#D1D9E6] pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-extrabold text-slate-900">
                      Console d'échange WhatsApp en direct avec {targetWhatsAppAgent.name} ({targetWhatsAppAgent.roleTitle})
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    targetWhatsAppAgent.whatsappStatus === 'connected' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {targetWhatsAppAgent.whatsappStatus === 'connected' ? 'Agent en ligne' : 'Agent déconnecté'}
                  </span>
                </div>

                {/* Chat window */}
                <div className="h-56 overflow-y-auto space-y-2 p-3 neu-pressed rounded-2xl">
                  {waSimChat.map((m, idx) => (
                    <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium space-y-1 ${
                        m.sender === 'user' 
                          ? 'neu-btn-primary text-white' 
                          : 'bg-white text-slate-800 shadow-xs border border-slate-200'
                      }`}>
                        {m.detectedRole && m.sender === 'agent' && (
                          <span className="text-[9px] font-mono font-bold text-sky-800 block">
                            [{m.detectedRole}]
                          </span>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        <span className={`text-[9px] block text-right font-mono ${
                          m.sender === 'user' ? 'text-white/70' : 'text-slate-400'
                        }`}>
                          {m.time}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isWaSimLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>{targetWhatsAppAgent.name} formule sa réponse WhatsApp selon son rôle...</span>
                    </div>
                  )}
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400">Questions fréquentes :</span>
                  <button
                    type="button"
                    onClick={() => setWaSimInput("Bonjour, je souhaite commander un article immédiatement.")}
                    className="neu-btn px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-700 cursor-pointer"
                  >
                    Demande de commande
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaSimInput("Bonjour, puis-je réserver une table pour ce soir à 20h ?")}
                    className="neu-btn px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-700 cursor-pointer"
                  >
                    Demande de réservation
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaSimInput("Bonjour, ma livraison n'est pas arrivée, je veux faire une réclamation.")}
                    className="neu-btn px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-700 cursor-pointer"
                  >
                    Réclamation SAV
                  </button>
                </div>

                {/* Input form */}
                <form onSubmit={handleSendWaSimMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={waSimInput}
                    onChange={(e) => setWaSimInput(e.target.value)}
                    placeholder={
                      targetWhatsAppAgent.whatsappStatus === 'connected'
                        ? `Envoyer un message WhatsApp à ${targetWhatsAppAgent.name}...`
                        : `${targetWhatsAppAgent.name} est déconnecté de WhatsApp (scannez pour activer)`
                    }
                    className="flex-1 neu-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={isWaSimLoading || !waSimInput.trim()}
                    className="neu-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer</span>
                  </button>
                </form>
              </div>

              {/* STEP 4: MATRICE COMPLÈTE MULTI-AGENTS WHATSAPP */}
              <div className="p-6 rounded-3xl neu-flat border border-white/80 space-y-4">
                <div className="flex items-center justify-between border-b border-[#D1D9E6] pb-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">
                      Vue d'ensemble des connexions WhatsApp de vos agents
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      Gérez la connexion WhatsApp de chaque IA indépendamment en un clic
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-800">
                    {agentsList.filter(a => a.whatsappStatus === 'connected').length} / {agentsList.length} en ligne
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#D1D9E6] text-slate-500 text-[10px] font-mono uppercase">
                        <th className="py-2 px-3">Agent IA</th>
                        <th className="py-2 px-3">Rôle strict</th>
                        <th className="py-2 px-3">Numéro WhatsApp</th>
                        <th className="py-2 px-3">Statut WhatsApp</th>
                        <th className="py-2 px-3 text-right">Action Directe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1D9E6]/60">
                      {agentsList.map(a => {
                        const isConn = a.whatsappStatus === 'connected';
                        return (
                          <tr key={a.id} className="hover:bg-white/30 transition-colors">
                            <td className="py-3 px-3 font-extrabold text-slate-900 flex items-center gap-2">
                              <Bot className="w-3.5 h-3.5 text-sky-600" />
                              <span>{a.name}</span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-600">{a.roleTitle}</td>
                            <td className="py-3 px-3 font-mono text-slate-700">{a.whatsappNumber || 'Non configuré'}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                                isConn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isConn ? '🟢 Connecté' : '⚪ Déconnecté'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isConn ? (
                                <button
                                  type="button"
                                  onClick={() => handleDisconnectWhatsAppAgent(a.id)}
                                  className="neu-btn px-2.5 py-1 rounded-xl text-[10px] font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
                                >
                                  Déconnecter
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStartScanForAgent(a.id)}
                                  className="neu-btn-primary px-2.5 py-1 rounded-xl text-[10px] font-bold text-white cursor-pointer shadow-xs"
                                >
                                  Scanner QR & Connecter
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SETTINGS: LATENCY & SECURITY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl neu-pressed space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Temporisation Naturelle (Anti-Ban)</span>
                    <span className="text-xs font-mono font-bold text-sky-800">{responseLatency} secondes</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    value={responseLatency}
                    onChange={(e) => setResponseLatency(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500">
                    Statut "en train d'écrire..." actif pendant {responseLatency}s avant l'envoi WhatsApp.
                  </p>
                </div>

                <div className="p-4 rounded-2xl neu-pressed space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Sécurité & Chiffrement</span>
                  <span className="text-xs font-bold text-slate-900 block">Session multi-appareils chiffrée</span>
                  <p className="text-[10px] text-slate-500">
                    Clés privées Baileys stockées en environnement sécurisé. Aucune donnée bancaire conservée.
                  </p>
                </div>
              </div>
            </>
          )}

            </div>
          </div>
        )}

        {/* TAB 4: BASE DE CONNAISSANCES, ASSIMILATION DE DOCUMENTS & NUMÉROS DE PAIEMENT PAR PAYS */}
        {currentTab === 'knowledge' && (
          <div className="space-y-6 animate-fadeIn">

            {/* BARRE DE NAVIGATION INTERNE DE LA BASE DE DONNÉES : DOCUMENTS IA vs NUMÉROS DE PAIEMENT PAR PAYS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl neu-flat bg-[#E9EEF4] border border-[#D1D9E6]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setKnowledgeSubPage('database_docs')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                    knowledgeSubPage === 'database_docs'
                      ? 'neu-pressed text-sky-800 bg-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Database className="w-4 h-4 text-sky-600" />
                  <span>Base de Données, Documents & Pilote IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setKnowledgeSubPage('payment_numbers')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                    knowledgeSubPage === 'payment_numbers'
                      ? 'neu-pressed text-emerald-800 bg-white shadow-xs'
                      : 'text-emerald-800 bg-emerald-50/70 border border-emerald-300/70 hover:bg-emerald-100/70'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Numéros Wave, Orange Money & Moyens de Paiement</span>
                </button>
              </div>

              <span className="text-[11px] font-mono font-bold text-emerald-800 px-3 py-1 rounded-full bg-emerald-100/80 self-start sm:self-auto">
                ● Synchronisé avec WhatsApp IA
              </span>
            </div>

            {/* SOUS-PAGE : NUMÉROS WAVE, ORANGE MONEY & AUTRES MOYENS DE PAIEMENT SELON LA CONNEXION */}
            {knowledgeSubPage === 'payment_numbers' && (
              <div className="p-6 sm:p-8 rounded-3xl neu-flat border border-emerald-300/80 bg-gradient-to-br from-white/70 via-sky-50/30 to-emerald-50/40 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D9E6] pb-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                          Numéros Wave, Orange Money & Autres Moyens de Paiement
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        Renseignez ici vos numéros d'encaissement dans la Base de Données. Dès qu'un commandeur veut payer sur WhatsApp, <strong>l'IA lui envoie directement votre numéro</strong> avec le montant à transférer.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAutoSendPaymentLink(prev => !prev)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                      autoSendPaymentLink
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'neu-btn text-slate-700'
                    }`}
                  >
                    {autoSendPaymentLink ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{autoSendPaymentLink ? 'Envoi Auto du Numéro par l\'IA : ACTIF' : 'Envoi Auto : DÉSACTIVÉ'}</span>
                  </button>
                </div>

                {/* SAISIE DES NUMÉROS WAVE, ORANGE MONEY & AUTRES MOYENS DE PAIEMENT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Numéro Wave */}
                  <div className="p-5 rounded-2xl bg-white/90 border border-sky-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <WaveLogo className="h-6 w-auto rounded" />
                        <label className="text-xs font-extrabold text-slate-900">
                          Numéro Wave
                        </label>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-mono font-bold">
                        Prioritaire WhatsApp
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Numéro Wave sur lequel le client envoie le paiement de sa commande.
                    </p>
                    <input
                      type="text"
                      value={merchantWavePhone}
                      onChange={(e) => setMerchantWavePhone(e.target.value)}
                      placeholder="Saisissez votre numéro Wave"
                      className="w-full neu-input rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 bg-[#ECF0F3]/60"
                    />
                  </div>

                  {/* Numéro Orange Money */}
                  <div className="p-5 rounded-2xl bg-white/90 border border-amber-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <OrangeMoneyLogo className="h-6 w-auto rounded" />
                        <label className="text-xs font-extrabold text-slate-900">
                          Numéro Orange Money
                        </label>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                        Actif WhatsApp
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Numéro Orange Money (ou Code Marchand) communiqué par l'IA au client.
                    </p>
                    <input
                      type="text"
                      value={merchantOmPhone}
                      onChange={(e) => setMerchantOmPhone(e.target.value)}
                      placeholder="Saisissez votre numéro Orange Money"
                      className="w-full neu-input rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 bg-[#ECF0F3]/60"
                    />
                  </div>

                  {/* 3e Moyen Local selon la connexion (Free Money / MTN MoMo / Moov Money / T-Money / Wafacash...) */}
                  <div className="p-5 rounded-2xl bg-white/90 border border-indigo-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FreeMoneyLogo className="h-6 w-auto rounded" />
                        <label className="text-xs font-extrabold text-slate-900">
                          {currentCountryPreset.localThirdLabel}
                        </label>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold">
                        Moyen Mobile Money
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Numéro secondaire Mobile Money communiqué automatiquement par l'IA.
                    </p>
                    <input
                      type="text"
                      value={merchantLocalThirdPhone}
                      onChange={(e) => setMerchantLocalThirdPhone(e.target.value)}
                      placeholder={currentCountryPreset.localThirdPlaceholder}
                      className="w-full neu-input rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 bg-[#ECF0F3]/60"
                    />
                  </div>

                  {/* Autre Moyen de Paiement Personnalisé */}
                  <div className="p-5 rounded-2xl bg-white/90 border border-emerald-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-900">
                        ➕ Autre Moyen de Paiement
                      </label>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                        Optionnel
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        value={merchantCustomMethodName}
                        onChange={(e) => setMerchantCustomMethodName(e.target.value)}
                        placeholder="Nom (ex: Wizall, Djamo, Ria...)"
                        className="w-full neu-input rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 bg-[#ECF0F3]/60"
                      />
                      <input
                        type="text"
                        value={merchantCustomMethodPhone}
                        onChange={(e) => setMerchantCustomMethodPhone(e.target.value)}
                        placeholder="Numéro ou compte à envoyer"
                        className="w-full neu-input rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 bg-[#ECF0F3]/60"
                      />
                    </div>
                  </div>
                </div>

                {/* APERÇU DU MESSAGE AUTOMATIQUE ENVOYÉ PAR L'IA AU COMMANDEUR */}
                <div className="p-4 rounded-2xl bg-emerald-950 text-emerald-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                      Aperçu en direct de la réponse de l'Agent IA ({currentAgent.name}) quand un commandeur veut payer sur WhatsApp :
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">WhatsApp Auto-Reply</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-white">
                    « Merci pour votre commande ! Pour régler le montant total, vous pouvez envoyer le paiement directement sur nos numéros officiels :
                    {merchantWavePhone ? ` • Wave : *${merchantWavePhone}*` : ''}
                    {merchantOmPhone ? ` • Orange Money : *${merchantOmPhone}*` : ''}
                    {merchantLocalThirdPhone ? ` • ${currentCountryPreset.localThirdLabel.replace('Numéro ', '')} : *${merchantLocalThirdPhone}*` : ''}
                    {merchantCustomMethodPhone ? ` • ${merchantCustomMethodName} : *${merchantCustomMethodPhone}*` : ''}.
                    Envoyez-nous une capture d'écran dès que le transfert est effectué pour validation immédiate ! »
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setKnowledgeSubPage('database_docs')}
                    className="neu-btn px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    ← Retour aux Documents & Base de Connaissances
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await syncAgentContextToServer(currentAgent.id, knowledgeTextState, promptTextState);
                      showToast(`Numéros de paiement enregistrés dans la Base de Données et synchronisés avec l'IA WhatsApp !`, 'success');
                    }}
                    className="neu-btn-primary px-6 py-3 rounded-xl text-xs font-extrabold text-white cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Enregistrer les Numéros de Paiement dans la Base de Données IA</span>
                  </button>
                </div>
              </div>
            )}

            {/* 1. PILOTE IA DES CHANGEMENTS EN DIRECT (TARIFS, HORAIRES, CATALOGUE, CONSIGNES) */}
            <div className="p-6 rounded-3xl neu-flat border border-emerald-300/60 bg-gradient-to-br from-emerald-50/40 to-sky-50/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D1D9E6] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Pilote IA des Changements en Direct & Synchronisation WhatsApp ({currentAgent.name})
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Écrivez tout changement en langage naturel (nouveaux prix, rupture de stock, nouveaux horaires, règles) : l'IA met à jour vos documents, vos instructions et votre agent WhatsApp Baileys instantanément.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold shrink-0">
                  SYNCHRO BAILEYS TEMPS RÉEL
                </span>
              </div>

              <form onSubmit={handleApplyLiveChanges} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={liveChangeDirective}
                    onChange={(e) => setLiveChangeDirective(e.target.value)}
                    placeholder="Saisissez vos nouvelles consignes, horaires ou modifications à appliquer..."
                    className="flex-1 neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-white/80 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isApplyingLiveChange || !liveChangeDirective.trim()}
                    className="neu-btn-primary px-5 py-3 rounded-2xl text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 shrink-0"
                  >
                    {isApplyingLiveChange ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mise à jour IA en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Appliquer le changement par l'IA</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {lastAppliedChangeReport && (
                <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200 space-y-2 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Changement assimilé et actif sur WhatsApp : {lastAppliedChangeReport.summaryOfChanges}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{lastAppliedChangeReport.timestamp}</span>
                  </div>
                  {lastAppliedChangeReport.appliedRules.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5 pl-1">
                      {lastAppliedChangeReport.appliedRules.map((rule, i) => (
                        <li key={i}>{rule}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* 2. IMPORTATION & ASSIMILATION INTELLIGENTE DE DOCUMENTS PAR L'IA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 p-6 rounded-3xl neu-flat border border-white/80 space-y-4">
                <div className="border-b border-[#D1D9E6] pb-3">
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>Ajouter un Document à faire apprendre par l'IA</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Importez un fichier (.txt, .csv, .md, .json) ou collez le contenu d'un document (contrat, catalogue, grille tarifaire, FAQ). L'IA l'analyse et l'intègre à {currentAgent.name}.
                  </p>
                </div>

                {/* Upload direct d'un fichier */}
                <div className="p-3.5 rounded-2xl neu-pressed border border-dashed border-sky-400/60 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Importer un fichier document</span>
                    <span className="text-[10px] text-slate-500">Lecture et structuration automatique par Gemini IA</span>
                  </div>
                  <label className="neu-btn px-3.5 py-2 rounded-xl text-xs font-extrabold text-sky-800 cursor-pointer shrink-0">
                    <span>Choisir un fichier</span>
                    <input
                      type="file"
                      accept=".txt,.md,.csv,.json,.log,.html"
                      onChange={handleFileUploadDocument}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Saisie / collage d'un document */}
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Titre du document (ex: Grille Tarifaire 2026, Conditions Livraison...)"
                    className="w-full neu-input rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-transparent font-semibold"
                  />
                  <textarea
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    rows={4}
                    placeholder="Collez ici le texte brut du document, tableau de prix ou règlement intérieur..."
                    className="w-full neu-input rounded-xl p-3 text-xs text-slate-800 bg-transparent"
                  />
                  <button
                    type="button"
                    disabled={isAssimilatingDoc || !newDocTitle.trim() || !newDocContent.trim()}
                    onClick={() => handleAssimilateDocument(newDocTitle, newDocContent)}
                    className="w-full neu-btn-primary py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isAssimilatingDoc ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyse et indexation IA du document...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyser et Faire Apprendre ce Document à l'IA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Liste des documents assimilés */}
                {uploadedDocs.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#D1D9E6]">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                      Documents assimilés par {currentAgent.name} ({uploadedDocs.length})
                    </span>
                    <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                      {uploadedDocs.map((doc) => (
                        <div key={doc.id} className="p-2.5 rounded-xl bg-white/80 border border-slate-200 flex items-start justify-between gap-2 text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{doc.title}</span>
                            {doc.summary && (
                              <span className="text-[10px] text-emerald-700 font-medium block">{doc.summary}</span>
                            )}
                            <span className="text-[9px] font-mono text-slate-400">{doc.type} • {doc.size}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold shrink-0">
                            Actif WA
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. BASE DE CONNAISSANCES CONSOLIDÉE DE L'AGENT */}
              <div className="lg:col-span-7 p-6 rounded-3xl neu-flat border border-white/80 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D9E6] pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Base de Connaissances Consolidée ({currentAgent.name})
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Contenu intégral consulté en temps réel par le serveur Baileys WhatsApp avant chaque réponse client.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full shrink-0">
                      {knowledgeTextState.length} caractères indexés
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">
                      Connaissances actives (Catalogue, Documents structurés par l'IA, FAQ, Tarifs, Règles)
                    </label>
                    <textarea
                      value={knowledgeTextState}
                      onChange={(e) => setKnowledgeTextState(e.target.value)}
                      rows={13}
                      className="w-full neu-input rounded-2xl p-4 text-xs text-slate-800 bg-transparent font-medium leading-relaxed"
                      placeholder="Collez ici librement tous vos menus, tarifs, documents et questions fréquentes..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={async () => {
                      setAgentsList(prev => prev.map(a => a.id === currentAgent.id ? { ...a, knowledgeText: knowledgeTextState } : a));
                      await syncAgentContextToServer(currentAgent.id, knowledgeTextState, promptTextState);
                      showToast(`Base de connaissances enregistrée et synchronisée en direct avec WhatsApp pour ${currentAgent.name} !`, 'success');
                    }}
                    className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-extrabold text-white cursor-pointer shadow-md"
                  >
                    Enregistrer & Synchroniser avec WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INSTRUCTIONS & PROMPTS (DOUBLE VOLET + SYNCHRO WHATSAPP) */}
        {currentTab === 'instructions' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl neu-flat border border-white/80 space-y-6">
              <div className="flex items-center justify-between border-b border-[#D1D9E6] pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Consignes & Instructions de l'Agent ({currentAgent.name})
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Volet 1 : Prompt d'instructions complet. Volet 2 : Discutez avec le Guide IA pour modifier le comportement de l'agent en direct sur WhatsApp !
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full neu-pill text-xs font-bold text-sky-800">
                  {currentAgent.roleTitle}
                </span>
              </div>

              {/* DUAL PANE LAYOUT */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                
                {/* PANE 1: PROMPT TEXT */}
                <div className="p-5 rounded-3xl neu-pressed flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D1D9E6]/60 pb-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      Volet 1 : Prompt d'Instructions Long
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {promptTextState.length} caractères
                    </span>
                  </div>

                  <textarea
                    value={promptTextState}
                    onChange={(e) => setPromptTextState(e.target.value)}
                    rows={12}
                    className="w-full flex-1 neu-input rounded-2xl p-3.5 text-xs text-slate-800 bg-[#ECF0F3] font-mono leading-relaxed"
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={async () => {
                        setAgentsList(prev => prev.map(a => a.id === currentAgent.id ? { ...a, promptInstruction: promptTextState } : a));
                        await syncAgentContextToServer(currentAgent.id, knowledgeTextState, promptTextState);
                        showToast(`Instructions enregistrées et actives en direct sur WhatsApp pour ${currentAgent.name} !`, 'success');
                      }}
                      className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md"
                    >
                      Enregistrer & Synchroniser le Prompt
                    </button>
                  </div>
                </div>

                {/* PANE 2: GUIDE IA COPILOTE */}
                <div className="p-5 rounded-3xl neu-flat flex flex-col justify-between space-y-3 border border-sky-300/40">
                  <div className="flex items-center justify-between border-b border-[#D1D9E6] pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span className="text-xs font-extrabold text-slate-900">
                        Volet 2 : Guide IA Copilote de Prompt
                      </span>
                    </div>
                    <span className="neu-pill px-2 py-0.5 text-[9px] font-bold text-sky-800">
                      ASSISTANCE EN DIRECT
                    </span>
                  </div>

                  <div className="h-64 overflow-y-auto space-y-2.5 p-3 neu-pressed rounded-2xl">
                    {guideChat.map((m, idx) => (
                      <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium ${
                          m.role === 'user' ? 'neu-btn-primary text-white' : 'bg-white text-slate-800 shadow-xs'
                        }`}>
                          <p className="leading-relaxed">{m.text}</p>
                        </div>
                      </div>
                    ))}
                    {isGuideLoading && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                        <span>Le guide génère et applique des règles adaptées...</span>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendGuidePromptChat} className="flex gap-2">
                    <input
                      type="text"
                      value={guideInput}
                      onChange={(e) => setGuideInput(e.target.value)}
                      placeholder="Expliquez le changement de comportement souhaité..."
                      className="flex-1 neu-input rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 bg-transparent"
                    />
                    <button
                      type="submit"
                      disabled={isGuideLoading || !guideInput.trim()}
                      className="neu-btn-primary px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CONVERSATIONS WHATSAPP */}
        {currentTab === 'conversations' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl neu-flat space-y-4">
              <div className="flex items-center justify-between border-b border-[#D1D9E6] pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Journal des Échanges WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedAgentFilter !== 'all' 
                      ? `Filtré pour l'agent : ${currentAgent.name} (${currentAgent.roleTitle})`
                      : 'Toutes les conversations en direct de la passerelle WhatsApp'
                    }
                  </p>
                </div>
                <button
                  onClick={fetchLiveWhatsAppStatus}
                  className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualiser</span>
                </button>
              </div>

              {displayedLogs.length === 0 ? (
                <div className="p-8 rounded-2xl neu-pressed text-center text-xs text-slate-500 font-medium space-y-2">
                  <p>Aucun message externe reçu pour le moment avec ce filtre.</p>
                  <p className="text-[11px] text-slate-400">
                    Dès qu'un client WhatsApp écrit au ({connectedPhone || 'Passerelle'}), la conversation s'affiche ici instantanément avec le rôle de l'agent qui a répondu.
                  </p>
                </div>
              ) : (
                <div className="neu-pressed rounded-2xl overflow-hidden border border-white/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#DFE5ED] text-slate-600 font-mono text-[10px] font-bold border-b border-[#D1D9E6]">
                      <tr>
                        <th className="p-3">Numéro Client</th>
                        <th className="p-3">Message Reçu</th>
                        <th className="p-3">Réponse IA ({responseLatency}s)</th>
                        <th className="p-3 text-right">Horodatage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1D9E6]/60">
                      {displayedLogs.map((log: any, idx: number) => (
                        <tr key={log.id || idx} className="hover:bg-white/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-emerald-800">
                            {log.phone_number || log.sender || '—'}
                          </td>
                          <td className="p-3 text-slate-700 max-w-xs truncate">
                            {log.incoming_message || log.message_body || '—'}
                          </td>
                          <td className="p-3 text-slate-800 font-medium max-w-xs truncate">
                            {log.reply_message || log.ai_response || '—'}
                          </td>
                          <td className="p-3 text-right font-mono text-[11px] text-slate-500">
                            {log.created_at || log.timestamp ? new Date(log.created_at || log.timestamp).toLocaleTimeString() : 'Récent'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: OPÉRATIONS COMMERCIALES (CRM, COMMANDES, RÉSERVATIONS) */}
        {currentTab === 'operations' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Sub navigation bar */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl neu-flat bg-[#E9EEF4] border border-[#D1D9E6] max-w-md">
              <button
                onClick={() => setOpsSubTab('crm')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  opsSubTab === 'crm' ? 'neu-pressed text-sky-800 bg-white' : 'text-slate-600'
                }`}
              >
                CRM Clients ({customers.length})
              </button>
              <button
                onClick={() => setOpsSubTab('orders')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  opsSubTab === 'orders' ? 'neu-pressed text-indigo-800 bg-white' : 'text-slate-600'
                }`}
              >
                Commandes ({orders.length})
              </button>
              <button
                onClick={() => setOpsSubTab('reservations')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  opsSubTab === 'reservations' ? 'neu-pressed text-amber-800 bg-white' : 'text-slate-600'
                }`}
              >
                Réservations ({reservations.length})
              </button>
            </div>

            {/* Sub-tab CRM */}
            {opsSubTab === 'crm' && (
              <div className="neu-flat p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#D1D9E6] pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">CRM Contacts Qualifiés</h3>
                    <p className="text-xs text-slate-500">Clients enregistrés automatiquement par vos agents sur WhatsApp.</p>
                  </div>
                </div>

                <div className="neu-pressed rounded-2xl overflow-hidden border border-white/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#DFE5ED] text-slate-600 font-mono text-[10px] font-bold border-b border-[#D1D9E6]">
                      <tr>
                        <th className="p-3">Nom</th>
                        <th className="p-3">Numéro WhatsApp</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3">Dépenses</th>
                        <th className="p-3 text-right">Dernier Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1D9E6]/60">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-white/40 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{c.name}</td>
                          <td className="p-3 font-mono text-slate-600">{c.phone}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full neu-pill text-[10px] font-bold text-sky-800">
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-800">{c.totalSpent.toLocaleString()} FCFA</td>
                          <td className="p-3 text-right text-slate-500">{c.lastContact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab Orders */}
            {opsSubTab === 'orders' && (
              <div className="neu-flat p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#D1D9E6] pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Commandes Traitées</h3>
                    <p className="text-xs text-slate-500">Panier moyen et commandes passées auprès de l'agent Ventes.</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-800 px-3 py-1 rounded-xl neu-pressed">
                    Total : {totalRevenue.toLocaleString()} FCFA
                  </div>
                </div>

                <div className="neu-pressed rounded-2xl overflow-hidden border border-white/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#DFE5ED] text-slate-600 font-mono text-[10px] font-bold border-b border-[#D1D9E6]">
                      <tr>
                        <th className="p-3">N° Commande</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Articles</th>
                        <th className="p-3">Montant</th>
                        <th className="p-3 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1D9E6]/60">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-white/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-700">{o.id}</td>
                          <td className="p-3 font-semibold text-slate-900">{o.customerName}</td>
                          <td className="p-3 text-slate-600">{Array.isArray(o.items) ? o.items.join(', ') : o.items}</td>
                          <td className="p-3 font-mono font-bold text-emerald-800">{o.totalAmount.toLocaleString()} FCFA</td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab Reservations */}
            {opsSubTab === 'reservations' && (
              <div className="neu-flat p-6 rounded-3xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#D1D9E6] pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Réservations & Créneaux</h3>
                    <p className="text-xs text-slate-500">Enregistrées en toute autonomie par l'agent de réservation.</p>
                  </div>
                </div>

                <div className="neu-pressed rounded-2xl overflow-hidden border border-white/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#DFE5ED] text-slate-600 font-mono text-[10px] font-bold border-b border-[#D1D9E6]">
                      <tr>
                        <th className="p-3">Client</th>
                        <th className="p-3">Date & Heure</th>
                        <th className="p-3">Couverts / Pers.</th>
                        <th className="p-3">Notes</th>
                        <th className="p-3 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D1D9E6]/60">
                      {reservations.map((r) => (
                        <tr key={r.id} className="hover:bg-white/40 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{r.customerName}</td>
                          <td className="p-3 font-semibold text-slate-800">{r.date} à {r.time}</td>
                          <td className="p-3 font-bold font-mono text-sky-800">{r.guestsCount} pers.</td>
                          <td className="p-3 text-slate-600">{r.notes || '—'}</td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: FACTURATION & PAYDUNYA */}
        {currentTab === 'billing' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl neu-flat space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D1D9E6] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-emerald-600 shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Facturation & Formules PayDunya
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Paiement en direct via Wave, Orange Money, Free Money et Cartes Bancaires.
                    </p>
                  </div>
                </div>
              </div>

              {paytechSuccessBanner && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{paytechSuccessBanner}</span>
                </div>
              )}

              {/* Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl neu-pressed">
                  <span className="text-[10px] text-slate-500 font-medium block">Formule Active</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-extrabold text-slate-900 font-display uppercase">
                      {isVipFreeUser ? 'ENTREPRISE VIP' : activePlan}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl neu-pressed">
                  <span className="text-[10px] text-slate-500 font-medium block">Solde de Crédits IA</span>
                  <span className="text-xl font-extrabold text-sky-800 font-mono block mt-1">
                    {creditsRemaining.toLocaleString()} / {creditsLimit.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    {creditsUsed.toLocaleString()} consommés
                  </span>
                </div>

                <div className="p-4 rounded-2xl neu-pressed">
                  <span className="text-[10px] text-slate-500 font-medium block">Passerelle Officielle</span>
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <PayDunyaLogo className="h-5 w-auto" />
                    <span className="text-xs font-extrabold text-emerald-700">{isVipFreeUser ? 'Exempté de Paiement ✓' : 'Agréée ✓'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <WaveLogo className="h-5 w-auto rounded shadow-xs" />
                    <OrangeMoneyLogo className="h-5 w-auto rounded shadow-xs" />
                    <FreeMoneyLogo className="h-5 w-auto rounded shadow-xs" />
                  </div>
                </div>
              </div>

              {/* Plans Comparison including 125 000 FCFA Enterprise Plan */}
              <div className="pt-4 border-t border-[#D1D9E6] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Changer de Formule (Débloquez le Filtrage Multi-Agents à 125 000 FCFA)
                  </h4>
                  <span className="text-xs text-slate-500">Sans engagement</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Starter */}
                  <div className="p-4 rounded-2xl neu-pressed flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900">STARTER</h5>
                      <span className="text-base font-extrabold font-display text-slate-800 block mt-1">12 500 FCFA / m</span>
                      <p className="text-[11px] text-slate-500 mt-1">1 agent IA dédié • 2 500 crédits.</p>
                    </div>
                    <button
                      onClick={() => setPaytechModalData({
                        itemName: 'Abonnement STARTER Mensuel',
                        itemPriceFCFA: 12500,
                        itemPriceEUR: 19,
                        planId: 'starter',
                        creditsAdded: 2500
                      })}
                      className="w-full py-2 rounded-xl neu-btn text-xs font-bold text-slate-800 hover:text-sky-800 cursor-pointer"
                    >
                      Choisir Starter
                    </button>
                  </div>

                  {/* Pro */}
                  <div className="p-4 rounded-2xl neu-pressed flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900">PRO</h5>
                      <span className="text-base font-extrabold font-display text-slate-800 block mt-1">25 000 FCFA / m</span>
                      <p className="text-[11px] text-slate-500 mt-1">2 agents IA • 6 000 crédits.</p>
                    </div>
                    <button
                      onClick={() => setPaytechModalData({
                        itemName: 'Abonnement PRO Mensuel',
                        itemPriceFCFA: 25000,
                        itemPriceEUR: 39,
                        planId: 'pro',
                        creditsAdded: 6000
                      })}
                      className="w-full py-2 rounded-xl neu-btn text-xs font-bold text-slate-800 hover:text-sky-800 cursor-pointer"
                    >
                      Choisir PRO
                    </button>
                  </div>

                  {/* Business */}
                  <div className="p-4 rounded-2xl neu-pressed flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900">BUSINESS</h5>
                      <span className="text-base font-extrabold font-display text-slate-800 block mt-1">95 000 FCFA / m</span>
                      <p className="text-[11px] text-slate-500 mt-1">4 agents IA • 35 000 crédits.</p>
                    </div>
                    <button
                      onClick={() => setPaytechModalData({
                        itemName: 'Abonnement BUSINESS Mensuel',
                        itemPriceFCFA: 95000,
                        itemPriceEUR: 149,
                        planId: 'business',
                        creditsAdded: 35000
                      })}
                      className="w-full py-2 rounded-xl neu-btn text-xs font-bold text-slate-800 hover:text-sky-800 cursor-pointer"
                    >
                      Choisir Business
                    </button>
                  </div>

                  {/* Enterprise 125 000 FCFA Plan */}
                  <div className="p-4 rounded-2xl neu-pressed ring-2 ring-indigo-500 bg-indigo-50/30 flex flex-col justify-between space-y-3 relative">
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold uppercase">
                      Filtrage Multi-IA
                    </span>
                    <div>
                      <h5 className="text-xs font-extrabold text-indigo-950">ENTREPRISE VIP</h5>
                      <span className="text-base font-extrabold font-display text-indigo-900 block mt-1">125 000 FCFA / m</span>
                      <p className="text-[11px] text-slate-600 mt-1">
                        <strong>Filtrage complet du dashboard par agent</strong> • Agents illimités • 60 000 crédits.
                      </p>
                    </div>
                    <button
                      onClick={() => setPaytechModalData({
                        itemName: 'Abonnement ENTREPRISE MULTI-AGENTS',
                        itemPriceFCFA: 125000,
                        itemPriceEUR: 190,
                        planId: 'enterprise_125k',
                        creditsAdded: 60000
                      })}
                      className="w-full py-2 rounded-xl neu-btn-primary text-xs font-extrabold text-white cursor-pointer shadow-md"
                    >
                      Souscrire 125 000 FCFA
                    </button>
                  </div>
                </div>
              </div>

              {/* Recharges de Crédits */}
              <div className="pt-8 border-t border-[#D1D9E6] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Recharges de Crédits IA (Pay-As-You-Go)
                  </h4>
                  <span className="text-xs text-slate-500">Ajout immédiat au solde</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'pack_1k', name: 'Pack Mini', priceFCFA: 2500, priceEUR: 4, creditsNum: 1000, desc: 'Petite recharge rapide' },
                    { id: 'pack_5k', name: 'Pack Basique', priceFCFA: 7500, priceEUR: 11, creditsNum: 5000, desc: 'Idéal pour pics ponctuels' },
                    { id: 'pack_10k', name: 'Pack Populaire', priceFCFA: 12000, priceEUR: 18, creditsNum: 10000, desc: 'Meilleur rapport qualité/prix', popular: true },
                    { id: 'pack_20k', name: 'Pack Avancé', priceFCFA: 20000, priceEUR: 30, creditsNum: 20000, desc: 'Pour besoins exigeants' },
                    { id: 'pack_50k', name: 'Pack Expert', priceFCFA: 40000, priceEUR: 61, creditsNum: 50000, desc: 'Pour gros volumes' },
                    { id: 'pack_100k', name: 'Pack Pro Max', priceFCFA: 70000, priceEUR: 106, creditsNum: 100000, desc: 'Capacité maximale' }
                  ].map((pack) => (
                    <div key={pack.id} className={`p-4 rounded-2xl flex flex-col justify-between space-y-3 relative ${pack.popular ? 'neu-pressed ring-2 ring-emerald-500 bg-emerald-50/30' : 'neu-pressed'}`}>
                      {pack.popular && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold uppercase">
                          Populaire
                        </span>
                      )}
                      <div>
                        <h5 className="text-xs font-extrabold text-slate-900">{pack.name}</h5>
                        <span className="text-base font-extrabold font-display text-slate-800 block mt-1">{pack.priceFCFA.toLocaleString()} FCFA</span>
                        <p className="text-[11px] text-slate-500 mt-1">{pack.creditsNum.toLocaleString()} crédits IA • {pack.desc}</p>
                      </div>
                      <button
                        onClick={() => setPaytechModalData({
                          itemName: `Recharge ${pack.name}`,
                          itemPriceFCFA: pack.priceFCFA,
                          itemPriceEUR: pack.priceEUR,
                          planId: pack.id,
                          creditsAdded: pack.creditsNum
                        })}
                        className={`w-full py-2 rounded-xl text-xs font-bold cursor-pointer ${pack.popular ? 'neu-btn-primary text-white shadow-md' : 'neu-btn text-slate-800 hover:text-emerald-800'}`}
                      >
                        Acheter {pack.priceFCFA.toLocaleString()} FCFA
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: ENTREPRISE & RESPONSABLE */}
        {currentTab === 'company_profile' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl neu-flat border border-white/80 space-y-6">
              <div className="flex items-center gap-3 border-b border-[#D1D9E6] pb-4">
                <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-sky-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Fiche Entreprise & Identité du Responsable
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Paramètres d'identification utilisés par vos agents IA lors des échanges clients.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Nom de l'entreprise</span>
                  <span className="text-sm font-extrabold text-slate-900 block">{activeCompany.name || 'Non renseigné'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Secteur</span>
                  <span className="text-sm font-extrabold text-slate-900 block">{activeCompany.industry || 'Non renseigné'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Responsable / Direction</span>
                  <span className="text-sm font-extrabold text-slate-900 block">
                    {activeCompany.personalContactName || 'Non renseigné'}
                  </span>
                  <span className="text-xs text-slate-500">{activeCompany.personalContactRole || ''}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Numéro WhatsApp Responsable (Escalade)</span>
                  <span className="text-sm font-mono font-bold text-emerald-800 block">
                    {activeCompany.personalContactPhone || activeCompany.phone || 'Non renseigné'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Adresse Physique</span>
                  <span className="text-xs text-slate-700 block">{activeCompany.address || 'Non renseignée'}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Horaires d'Ouverture</span>
                  <span className="text-xs text-slate-700 block">{activeCompany.openingHours || 'Non renseignés'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D1D9E6] flex justify-end">
                <button
                  onClick={() => setShowWizardModal(true)}
                  className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-sky-800 hover:text-sky-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Mettre à jour via l'Assistant 6 étapes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 6-STEP CREATE AGENT WIZARD MODAL */}
      {showWizardModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <CreateAgentWizard
            initialCompany={activeCompany}
            onComplete={handleAgentCreated}
            onCancel={() => setShowWizardModal(false)}
          />
        </div>
      )}

      {/* AUTHENTIC WHATSAPP WEB OFFICIAL PORTAL MODAL */}
      <WhatsAppWebModal
        isOpen={showWhatsAppWebModal || showQrModal}
        onClose={() => {
          setShowWhatsAppWebModal(false);
          setShowQrModal(false);
        }}
        agentsList={agentsList}
        selectedAgentId={selectedWhatsAppAgentId}
        onSelectAgent={setSelectedWhatsAppAgentId}
        onConfirmConnected={handleConfirmScan}
        liveQrImage={liveQrImage}
        onRefreshQr={() => {
          fetchLiveWhatsAppStatus();
          setQrRefreshCountdown(40);
        }}
        isFetchingQr={isFetchingQr}
        countdown={qrRefreshCountdown}
      />

      {/* PAYDUNYA CHECKOUT MODAL */}
      {paytechModalData && (
        <PayDunyaModal
          isOpen={Boolean(paytechModalData)}
          onClose={() => setPaytechModalData(null)}
          itemName={paytechModalData.itemName}
          itemPriceFCFA={paytechModalData.itemPriceFCFA}
          itemPriceEUR={paytechModalData.itemPriceEUR}
          planId={paytechModalData.planId}
          creditsAdded={paytechModalData.creditsAdded}
          companyName={activeCompany.name}
          clientPhone={connectedPhone || activeCompany.phone}
          onPaymentSuccess={(tx) => {
            if (paytechModalData.planId) {
              const newPlan = paytechModalData.planId as any;
              setActivePlan(newPlan);
              setActiveCompany(prev => ({ 
                ...prev, 
                plan: newPlan,
                planPriceXOF: paytechModalData.itemPriceFCFA 
              }));
            }
            if (paytechModalData.creditsAdded) {
              const added = paytechModalData.creditsAdded;
              setCompanyCreditsLimit(prev => prev + added);
              setActiveCompany(prev => ({ ...prev, monthlyCreditsLimit: (prev.monthlyCreditsLimit || 6000) + added }));
            }
            setPaytechSuccessBanner(`Paiement de ${paytechModalData.itemPriceFCFA.toLocaleString()} FCFA confirmé par PayDunya (${tx.paymentMethod || 'Mobile Money'}) ! Vos fonctionnalités sont immédiatement actives.`);
            setTimeout(() => setPaytechSuccessBanner(null), 7000);
          }}
        />
      )}

      {/* Native Mobile Bottom Navigation Bar (< md) */}
      <nav
        aria-label="Navigation Dashboard Mobile"
        className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || 
              (item.id === 'operations' && ['clients', 'orders', 'reservations', 'calendar', 'products', 'invoices'].includes(currentTab)) ||
              (item.id === 'agents' && currentTab === 'agent') ||
              (item.id === 'whatsapp' && currentTab === 'settings');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCurrentTab(item.id);
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
            <span className="text-[10px] leading-none truncate max-w-full">Plus (9)</span>
          </button>
        </div>
      </nav>

    </div>
  );
};
export default EnterpriseDashboard;
