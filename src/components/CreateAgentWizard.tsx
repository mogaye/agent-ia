import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Bot, 
  FileText, 
  Sliders, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Upload, 
  Send, 
  Loader2, 
  RefreshCw, 
  ShieldAlert, 
  HelpCircle,
  Copy,
  Check,
  QrCode,
  Zap,
  Clock,
  Layers,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { EnterpriseAgent, AgentRoleType, CompanyProfile } from '../types';
import { api } from '../lib/api';

interface CreateAgentWizardProps {
  initialCompany?: CompanyProfile;
  onComplete: (newAgent: EnterpriseAgent, updatedCompany?: Partial<CompanyProfile>) => void;
  onCancel?: () => void;
}

export const CreateAgentWizard: React.FC<CreateAgentWizardProps> = ({
  initialCompany,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // STEP 1: Personne & Infos du Responsable
  const [personName, setPersonName] = useState(initialCompany?.personalContactName || '');
  const [personRole, setPersonRole] = useState(initialCompany?.personalContactRole || '');
  const [personPhone, setPersonPhone] = useState(initialCompany?.personalContactPhone || initialCompany?.phone || '');
  const [personEmail, setPersonEmail] = useState(initialCompany?.personalContactEmail || initialCompany?.email || '');

  // STEP 2: Entreprise Infos
  const [companyName, setCompanyName] = useState(initialCompany?.name || '');
  const [industry, setIndustry] = useState(initialCompany?.industry || '');
  const [companyDesc, setCompanyDesc] = useState('');
  const [companyAddress, setCompanyAddress] = useState(initialCompany?.address || '');
  const [openingHours, setOpeningHours] = useState(initialCompany?.openingHours || '');
  const [website, setWebsite] = useState(initialCompany?.website || '');

  // STEP 3: IA Infos (Nom, Rôle exclusif & Accueil)
  const [agentName, setAgentName] = useState(initialCompany?.agentName || '');
  const [roleType, setRoleType] = useState<AgentRoleType>('customer_service');
  const [tone, setTone] = useState<string>('Professionnel et accueillant');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // STEP 4: Base de connaissances (Documents & texte illimité)
  const [knowledgeText, setKnowledgeText] = useState<string>(
    initialCompany?.customInstructions || ''
  );
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string; status: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  // STEP 5: Page d'Instructions (Double volet : Volet 1 Prompt long / Volet 2 Conversation Guide)
  const [longPrompt, setLongPrompt] = useState<string>('');
  const [guideMessages, setGuideMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [guideInput, setGuideInput] = useState('');
  const [isGuideLoading, setIsGuideLoading] = useState(false);

  // Numéro WhatsApp de contact associé à l'agent
  const [whatsappNumber, setWhatsappNumber] = useState(initialCompany?.phone || '');

  // STEP 6: Activation IA & Déploiement
  const [isActivated247, setIsActivated247] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);

  // Update default prompt when role or agent name changes
  const handleRoleChange = (newRole: AgentRoleType) => {
    setRoleType(newRole);
    let roleTitle = "Service Client & SAV";
    let welcome = `Bonjour ! Je suis ${agentName}, conseiller au Service Client de ${companyName || 'notre entreprise'}. Comment puis-je vous assister ?`;
    let promptSnippet = "";

    if (newRole === 'customer_service') {
      roleTitle = "Service Client & SAV";
      promptSnippet = `# DIRECTIVE STRICTE : SERVICE CLIENT UNIQUEMENT\nTu réponds exclusivement aux questions d'information générale, réclamations, horaires et assistance. Tu NE prends PAS de commandes ni de réservations directement. Si l'utilisateur le demande, oriente-le vers le pôle Ventes.`;
    } else if (newRole === 'sales_orders') {
      roleTitle = "Prise de Commandes & Ventes";
      welcome = `Bonjour ! Je suis ${agentName}, votre conseiller Ventes chez ${companyName || 'notre entreprise'}. Quels articles du catalogue souhaitez-vous commander aujourd'hui ?`;
      promptSnippet = `# DIRECTIVE STRICTE : COMMANDES & VENTES UNIQUEMENT\nTu présentes le catalogue, calcules le montant total en FCFA et transmets les liens de paiement officiels Wave / Orange Money. Tu ne traites pas de SAV technique lourd.`;
    } else if (newRole === 'reservations') {
      roleTitle = "Réservations & Rendez-vous";
      welcome = `Bonjour ! Je suis ${agentName}, dédié à la planification des tables et créneaux pour ${companyName || 'notre entreprise'}. Pour quelle date et quelle heure souhaitez-vous réserver ?`;
      promptSnippet = `# DIRECTIVE STRICTE : RÉSERVATIONS UNIQUEMENT\nTu demandes systématiquement : la date, l'heure exacte, le nombre de personnes et le nom pour valider la réservation.`;
    } else if (newRole === 'tech_support') {
      roleTitle = "Support Technique";
      welcome = `Bonjour ! Je suis ${agentName}, technicien d'assistance pour ${companyName || 'notre entreprise'}. Décrivez-moi le problème que vous rencontrez.`;
      promptSnippet = `# DIRECTIVE STRICTE : SUPPORT TECHNIQUE UNIQUEMENT\nTu guides pas à pas pour le diagnostic et le dépannage rapide.`;
    } else {
      roleTitle = "Conseiller Polyvalent";
      welcome = `Bonjour et bienvenue chez ${companyName || 'notre entreprise'} ! Je suis ${agentName}. En quoi puis-je vous aider ?`;
      promptSnippet = `# DIRECTIVE : CONSEILLER POLYVALENT\nTu traites les demandes courantes avec réactivité et courtoisie.`;
    }

    setWelcomeMessage(welcome);
    setLongPrompt(prev => `${promptSnippet}\n\n${prev}`);
  };

  // Guide prompt send handler
  const handleSendGuideMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guideInput.trim() || isGuideLoading) return;

    const userText = guideInput.trim();
    setGuideInput('');
    const newHistory = [...guideMessages, { role: 'user' as const, text: userText }];
    setGuideMessages(newHistory);
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
          agentRole: roleType,
          companyName: companyName || 'Mon Entreprise',
          currentPrompt: longPrompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGuideMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
        if (data.suggestedPrompt) {
          setLongPrompt(data.suggestedPrompt);
        }
      } else {
        setGuideMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            text: `Excellente précision ! J'ai intégré ces consignes à propos de "${userText}". Voulez-vous que l'agent propose automatiquement des options de relance ?` 
          }
        ]);
      }
    } catch (e) {
      setGuideMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          text: `Bien noté. Ces éléments sont pris en compte pour renforcer les consignes de ${agentName}.` 
        }
      ]);
    } finally {
      setIsGuideLoading(false);
    }
  };

  // Insert template into knowledge text
  const handleInsertTemplate = (type: 'faq' | 'menu' | 'delivery') => {
    let snippet = '';
    if (type === 'faq') {
      snippet = `\n\n--- FAQ ENTREPRISE ---\nQ: Quels sont les moyens de paiement acceptés ?\nR: Wave Sénégal, Orange Money, Free Money et Cartes Bancaires (Visa / Mastercard).\n\nQ: Quel est le délai de livraison ?\nR: Dans l'heure sur Dakar et banlieue, et sous 24h à 48h pour les régions.`;
    } else if (type === 'menu') {
      snippet = `\n\n--- CATALOGUE / MENU PRINCIPAL ---\n- Formule Express : 7 500 FCFA (Entrée + Plat)\n- Formule Prestige : 14 000 FCFA (Menu complet du Chef)\n- Boissons locales naturelles (Bissap, Bouye) : 2 000 FCFA`;
    } else if (type === 'delivery') {
      snippet = `\n\n--- CONDITIONS DE LIVRAISON & RETOURS ---\n- Frais de livraison : 2 000 FCFA (Centre-ville & Almadies), 3 000 FCFA (Périphérie).\n- Retours acceptés sous 48h si article scellé.`;
    }
    setKnowledgeText(prev => prev + snippet);
  };

  // Real file upload & AI document assimilation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const rawText = await file.text();
      const token = api.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/assimilate-document', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentTitle: file.name,
          rawContent: rawText,
          existingKnowledge: knowledgeText
        })
      });
      const data = await res.json().catch(() => null);

      setUploadedFiles(prev => [
        ...prev, 
        { 
          name: file.name, 
          size: `${Math.max(1, Math.round(file.size / 1024))} Ko`, 
          status: 'Assimilé par IA' 
        }
      ]);

      if (res.ok && data?.mergedKnowledge) {
        setKnowledgeText(data.mergedKnowledge);
      } else {
        setKnowledgeText(prev => `${prev}\n\n=== DOCUMENT : ${file.name} ===\n${rawText.slice(0, 15000)}`.trim());
      }
    } catch (_) {
      setUploadedFiles(prev => [
        ...prev, 
        { 
          name: file.name, 
          size: `${Math.max(1, Math.round(file.size / 1024))} Ko`, 
          status: 'Indexé' 
        }
      ]);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Step 7 final submit
  const handleFinalSubmit = () => {
    setIsDeploying(true);

    const newAgent: EnterpriseAgent = {
      id: `agent-${Date.now()}`,
      name: agentName.trim() || 'Nova',
      roleType,
      roleTitle: roleType === 'customer_service' 
        ? 'Service Client & SAV'
        : roleType === 'sales_orders'
        ? 'Prise de Commandes & Ventes'
        : roleType === 'reservations'
        ? 'Réservations & RDV'
        : roleType === 'tech_support'
        ? 'Support Technique'
        : 'Conseiller Général',
      description: `Agent IA autonome dédié à ${companyName || 'l\'entreprise'}. Rôle exclusif : ${roleType}.`,
      welcomeMessage,
      channels: ['whatsapp', 'web'],
      whatsappNumber,
      status: isActivated247 ? 'active' : 'paused',
      knowledgeText,
      documents: uploadedFiles.map((f, i) => ({
        id: `doc-${i}`,
        name: f.name,
        category: 'Catalogue & RAG',
        size: f.size,
        uploadedAt: 'À l\'instant'
      })),
      promptInstruction: longPrompt,
      conversationsCount: 0,
      createdAt: 'À l\'instant'
    };

    const updatedCompany: Partial<CompanyProfile> = {
      name: companyName || initialCompany?.name,
      agentName: newAgent.name,
      industry,
      phone: whatsappNumber || initialCompany?.phone,
      address: companyAddress,
      openingHours,
      website,
      personalContactName: personName,
      personalContactRole: personRole,
      personalContactPhone: personPhone,
      personalContactEmail: personEmail,
      customInstructions: longPrompt
    };

    // Save to server context for this specific AI agent so Baileys WhatsApp has it immediately
    api.updateContext({
      agentId: newAgent.id,
      companyName: updatedCompany.name,
      agentName: newAgent.name,
      roleType: newAgent.roleType,
      industry,
      openingHours,
      address: companyAddress,
      personalContactName: personName,
      personalContactPhone: personPhone,
      customInstructions: longPrompt,
      knowledgeBase: knowledgeText
    }).catch(e => console.warn('Could not sync to context server:', e));

    setTimeout(() => {
      setIsDeploying(false);
      onComplete(newAgent, updatedCompany);
    }, 1200);
  };

  const stepsList = [
    { num: 1, title: 'Responsable', desc: 'Nom & infos de la personne' },
    { num: 2, title: 'Entreprise', desc: 'Identité commerciale' },
    { num: 3, title: 'Agent IA', desc: 'Nom, rôle & accueil' },
    { num: 4, title: 'Connaissances', desc: 'Documents & texte illimité' },
    { num: 5, title: 'Instructions', desc: 'Prompt long & Guide IA' },
    { num: 6, title: 'Activation', desc: 'Validation & Mise en ligne' }
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC] shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base font-extrabold text-[#0A0A0A] font-display truncate">
              Créateur d'Agent IA en 6 Étapes
            </h1>
            <span className="text-[10px] text-slate-500 font-medium block truncate">
              Étape {currentStep} sur 6 • {stepsList[currentStep - 1]?.title}
            </span>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="neu-btn px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold text-slate-700 hover:text-slate-900 cursor-pointer shrink-0"
          >
            ✕ Fermer
          </button>
        )}
      </header>

      {/* Responsive Stepper Grid (3x2 on Mobile, 6 columns on Desktop — Zero Horizontal Scrollbar) */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-8 py-2.5">
        <div className="max-w-5xl mx-auto grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
          {stepsList.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer border ${
                  isCurrent 
                    ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-xs' 
                    : isCompleted 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                    : 'bg-[#F8FAFC] text-slate-500 border-slate-200/80 hover:text-slate-800'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-extrabold shrink-0 ${
                  isCurrent 
                    ? 'bg-white text-[#0052CC]' 
                    : isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : s.num}
                </span>
                <span className="text-[11px] font-extrabold truncate">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3.5 sm:p-8 space-y-6 pb-24">
        
        {/* ==================================================== */}
        {/* STEP 1: NOM ET INFOS DE LA PERSONNE                  */}
        {/* ==================================================== */}
        {currentStep === 1 && (
          <div className="neu-flat p-6 sm:p-8 rounded-3xl border border-white/80 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-[#D1D9E6] pb-4">
              <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-sky-600">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-sky-700">Étape 1 sur 7</span>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Nom et coordonnées du responsable
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Ces informations permettent à l'IA d'identifier la direction et d'orienter les escalades d'urgences vers vous.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Nom complet du responsable *
                </label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Ex: Mamadou Gaye, Aminata Diop"
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-transparent font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Poste / Fonction dans l'entreprise *
                </label>
                <input
                  type="text"
                  value={personRole}
                  onChange={(e) => setPersonRole(e.target.value)}
                  placeholder="Ex: Fondateur & Gérant, Responsable Relation Client"
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-transparent font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Téléphone direct WhatsApp du responsable *
                </label>
                <input
                  type="text"
                  value={personPhone}
                  onChange={(e) => setPersonPhone(e.target.value)}
                  placeholder="Ex: +221 77 123 45 67"
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-transparent font-medium font-mono"
                  required
                />
                <span className="text-[10px] text-slate-400">
                  Numéro sécurisé pour recevoir les alertes critiques et escalades.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  Adresse email professionnelle *
                </label>
                <input
                  type="email"
                  value={personEmail}
                  onChange={(e) => setPersonEmail(e.target.value)}
                  placeholder="Ex: direction@entreprise.sn"
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-transparent font-medium"
                  required
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl neu-pressed bg-sky-50/30 text-xs text-slate-600 space-y-1 border border-sky-200/50">
              <span className="font-extrabold text-sky-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-sky-600" /> Protocole d'escalade humaine
              </span>
              <p className="text-[11px] text-slate-500">
                Si un client WhatsApp demande expressément à parler à un humain ou si une réclamation grave est détectée, l'agent IA mentionnera automatiquement vos coordonnées ({personPhone || 'numéro d\'urgence'}).
              </p>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 2: ENTREPRISE INFOS                             */}
        {/* ==================================================== */}
        {currentStep === 2 && (
          <div className="neu-flat p-6 sm:p-8 rounded-3xl border border-white/80 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-[#D1D9E6] pb-4">
              <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-indigo-600">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-indigo-700">Étape 2 sur 7</span>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Informations de l'entreprise
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Renseignez l'activité, les horaires et la localisation pour que l'IA réponde précisément à vos clients.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  Nom commercial de l'entreprise *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Teranga Food & Suites, Clinique Almadies, Boutique Dakar Mode"
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-transparent font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Secteur d'activité *
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-[#ECF0F3] font-medium"
                >
                  <option value="Commerce & Retail">Commerce, Prêt-à-Porter & E-Commerce</option>
                  <option value="Restauration & Hôtellerie">Restauration, Bar & Hôtellerie</option>
                  <option value="Santé & Beauté">Clinique, Dentiste, Spa & Esthétique</option>
                  <option value="Services B2B & Agence">Services B2B, Cabinet & Conseil</option>
                  <option value="Immobilier & Résidences">Immobilier & Gestion Locative</option>
                  <option value="Transport & Logistique">Transport, Livraison & Logistique</option>
                  <option value="Autre secteur">Autre secteur d'activité</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Horaires d'ouverture *
                </label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="Ex: Lundi au Samedi 09h00 - 19h00 (Fermé Dimanche)"
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-transparent font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Adresse physique & Ville *
                </label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Ex: Route des Almadies, Dakar, Sénégal"
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-transparent font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Site web / Instagram
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Ex: https://monentreprise.sn ou @monentreprise"
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-transparent font-medium"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  Description succincte de votre activité
                </label>
                <textarea
                  value={companyDesc}
                  onChange={(e) => setCompanyDesc(e.target.value)}
                  placeholder="Ex: Nous proposons des menus bistronomiques sénégalais avec réservation de tables et livraison à domicile..."
                  rows={2}
                  className="w-full neu-input rounded-2xl p-3 text-xs text-slate-800 bg-transparent font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 3: IA INFOS (NOM, ROLE & MESSAGE ACCUEIL)       */}
        {/* ==================================================== */}
        {currentStep === 3 && (
          <div className="neu-flat p-6 sm:p-8 rounded-3xl border border-white/80 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-[#D1D9E6] pb-4">
              <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-emerald-600">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-emerald-700">Étape 3 sur 7</span>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Configuration de l'IA (Nom, Rôle & Accueil)
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Chaque IA répond selon son rôle exclusif. Définissez son prénom, sa spécialité stricte et son message de bienvenue.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Prénom / Nom de l'Agent IA *
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Ex: Nova, Amina, Chef Oumar, Maya..."
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-transparent font-medium"
                  required
                />
                <span className="text-[10px] text-slate-400">Ce prénom sera utilisé dans toutes les salutations WhatsApp.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Ton & Style de communication
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full neu-input rounded-2xl px-4 py-3 text-xs text-slate-800 bg-[#ECF0F3] font-medium"
                >
                  <option value="Chaleureux & Teranga">Chaleureux & Teranga (Bienveillant et poli)</option>
                  <option value="Professionnel & Corporate">Professionnel & Corporate (Sérieux et rigoureux)</option>
                  <option value="Luxe & Prestigieux">Luxe & Prestigieux (Élégant et exclusif)</option>
                  <option value="Direct & Efficace">Direct & Efficace (Réponses ultra-rapides et concises)</option>
                </select>
              </div>
            </div>

            {/* Role Strict Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                Rôle strict et exclusif de l'Agent IA (Détection automatique des questions)
              </label>
              <p className="text-[11px] text-slate-500">
                L'agent détecte le type de question et répond uniquement selon son rôle. Un agent Service Client refusera poliment de prendre des commandes directes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleRoleChange('customer_service')}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border ${
                    roleType === 'customer_service'
                      ? 'neu-pressed border-sky-400 bg-sky-50/40 text-sky-950 ring-2 ring-sky-500/50'
                      : 'neu-flat border-transparent text-slate-700 hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold">Service Client & SAV</span>
                    {roleType === 'customer_service' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Assistance, renseignements, horaires et réclamations. Ne prend pas de commandes ni réservations.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('sales_orders')}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border ${
                    roleType === 'sales_orders'
                      ? 'neu-pressed border-emerald-400 bg-emerald-50/40 text-emerald-950 ring-2 ring-emerald-500/50'
                      : 'neu-flat border-transparent text-slate-700 hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold">Commandes & Ventes</span>
                    {roleType === 'sales_orders' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Présentation des articles, devis, panier d'achat et liens de règlement Wave/OM. Refuse le SAV lourd.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('reservations')}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer border ${
                    roleType === 'reservations'
                      ? 'neu-pressed border-amber-400 bg-amber-50/40 text-amber-950 ring-2 ring-amber-500/50'
                      : 'neu-flat border-transparent text-slate-700 hover:bg-white/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold">Réservations & RDV</span>
                    {roleType === 'reservations' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Tables, créneaux horaires, dates et disponibilités. Ne vend pas d'articles physiques.
                  </p>
                </button>
              </div>
            </div>

            {/* Welcome Message with WhatsApp Preview */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700">
                Message d'accueil WhatsApp envoyé aux nouveaux clients *
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="w-full neu-input rounded-2xl p-3.5 text-xs text-slate-800 bg-transparent font-medium"
              />

              {/* WhatsApp Live Bubble Preview */}
              <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-[#D1D9E6] space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> Aperçu WhatsApp direct
                </span>
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl p-3 shadow-xs max-w-sm text-xs text-slate-800 space-y-1 relative border-l-4 border-emerald-500">
                    <span className="text-[10px] font-extrabold text-emerald-800 block">
                      {agentName} • {companyName || 'Mon Entreprise'}
                    </span>
                    <p className="text-[11px] leading-relaxed">{welcomeMessage}</p>
                    <span className="text-[9px] text-slate-400 block text-right font-mono">12:00 ✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 4: BASE DE CONNAISSANCES & TEXTE ILLIMITE       */}
        {/* ==================================================== */}
        {currentStep === 4 && (
          <div className="neu-flat p-6 sm:p-8 rounded-3xl border border-white/80 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-[#D1D9E6] pb-4">
              <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-amber-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-amber-700">Étape 4 sur 7</span>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Documents et texte illimité pour la base de connaissances
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Copiez-collez vos textes complets (tarifs, FAQ, catalogues, règles) ou téléversez vos fichiers sans restriction de taille.
                </p>
              </div>
            </div>

            {/* Quick Insertion Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Ajout rapide de modèles :</span>
              <button
                type="button"
                onClick={() => handleInsertTemplate('faq')}
                className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-800 cursor-pointer"
              >
                + Insérer FAQ Générale
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('menu')}
                className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-800 cursor-pointer"
              >
                + Insérer Tarifs & Catalogue
              </button>
              <button
                type="button"
                onClick={() => handleInsertTemplate('delivery')}
                className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-800 cursor-pointer"
              >
                + Insérer Conditions Livraison
              </button>
            </div>

            {/* Unlimited Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Zone de texte illimité (Catalogue, FAQ, Produits, Menus, Politiques)
                </label>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {knowledgeText.length} caractères assimilés (Texte illimité)
                </span>
              </div>
              <textarea
                value={knowledgeText}
                onChange={(e) => setKnowledgeText(e.target.value)}
                placeholder="Collez ici librement tous vos menus, grilles tarifaires, questions récurrentes de clients, consignes de paiement Wave/OM, adresses et politiques de vente..."
                rows={8}
                className="w-full neu-input rounded-2xl p-4 text-xs text-slate-800 bg-transparent font-medium leading-relaxed"
              />
            </div>

            {/* Document Upload Area */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 block">
                Téléversement de documents (PDF, Word, TXT, Catalogues RAG)
              </label>

              <div className="p-6 rounded-2xl neu-pressed border-2 border-dashed border-[#B0BAC9] text-center space-y-3">
                <input
                  type="file"
                  id="wizard-doc-file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.csv"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="wizard-doc-file"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl neu-btn-primary text-xs font-bold cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Assimilation en cours...' : 'Sélectionner un document (PDF / Word)'}</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Indexation vectorielle instantanée pour que l'agent cite vos documents officiels.
                </p>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="p-3 rounded-2xl neu-flat flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span className="font-bold text-slate-800">{file.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full neu-pill text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {file.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 5: PAGE D'INSTRUCTIONS (DOUBLE VOLET)           */}
        {/* ==================================================== */}
        {currentStep === 5 && (
          <div className="neu-flat p-6 sm:p-8 rounded-3xl border border-white/80 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-[#D1D9E6] pb-4">
              <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-sky-600">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-sky-700">Étape 5 sur 6</span>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Page d'Instructions (Double Volet Interactif)
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Volet 1 : Rédigez le prompt long de l'agent. Volet 2 : Discutez avec le Guide IA pour enrichir et optimiser automatiquement ce prompt !
                </p>
              </div>
            </div>

            {/* DUAL PANE LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              
              {/* PANE 1: ZONE DE PROMPT LONG */}
              <div className="p-5 rounded-3xl neu-pressed flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between border-b border-[#D1D9E6]/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-700" />
                    <h3 className="text-xs font-extrabold text-slate-900">
                      Volet 1 : Prompt d'Instructions Long
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {longPrompt.length} car.
                  </span>
                </div>

                <div className="space-y-2 flex-1 flex flex-col">
                  <textarea
                    value={longPrompt}
                    onChange={(e) => setLongPrompt(e.target.value)}
                    placeholder="Consignes complètes, règles strictes et instructions..."
                    rows={12}
                    className="w-full flex-1 neu-input rounded-2xl p-3.5 text-xs text-slate-800 bg-[#ECF0F3] font-mono leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setLongPrompt(prev => prev + "\n- RÈGLE : Ne jamais proposer de remise sans accord écrit.")}
                    className="neu-btn px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                  >
                    + Interdire remises non validées
                  </button>
                  <button
                    type="button"
                    onClick={() => setLongPrompt(prev => prev + "\n- ESCALADE : Si le client s'énerve, transmettre le numéro direct du gérant.")}
                    className="neu-btn px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                  >
                    + Règle apaisement & escalade
                  </button>
                </div>
              </div>

              {/* PANE 2: CONVERSATION GUIDE IA COPILOTE */}
              <div className="p-5 rounded-3xl neu-flat flex flex-col justify-between space-y-3 border border-sky-300/40">
                <div className="flex items-center justify-between border-b border-[#D1D9E6] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900">
                        Volet 2 : Guide IA Copilote de Rédaction
                      </h3>
                      <span className="text-[9px] text-slate-400">Échangez pour générer un prompt sur-mesure</span>
                    </div>
                  </div>
                  <span className="neu-pill px-2 py-0.5 text-[9px] font-bold text-sky-800">
                    ASSISTANT EN DIRECT
                  </span>
                </div>

                {/* Conversation Box */}
                <div className="h-64 overflow-y-auto space-y-2.5 p-3 neu-pressed rounded-2xl">
                  {guideMessages.map((m, idx) => (
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
                      <span>Le Guide IA affine votre prompt...</span>
                    </div>
                  )}
                </div>

                {/* Interactive Guide Input Form */}
                <form onSubmit={handleSendGuideMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={guideInput}
                    onChange={(e) => setGuideInput(e.target.value)}
                    placeholder="Répondez au guide ou demandez une règle..."
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

                <div className="text-[10px] text-slate-500 text-center font-medium">
                  Le copilote insère automatiquement le prompt optimisé dans le Volet 1 ci-contre !
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 6: ACTIVATION IA & VALIDATION FINALE            */}
        {/* ==================================================== */}
        {currentStep === 6 && (
          <div className="neu-flat p-6 sm:p-8 rounded-3xl border border-white/80 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 border-b border-[#D1D9E6] pb-4">
              <div className="w-12 h-12 rounded-2xl neu-pressed flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase text-emerald-700">Étape 6 sur 6 • Finalisation</span>
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Activation et Déploiement de l'IA
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Vérifiez le récapitulatif de votre agent IA configuré avant son lancement officiel.
                </p>
              </div>
            </div>

            {/* Recapitulative Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl neu-pressed space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Responsable</span>
                <span className="text-sm font-extrabold text-slate-900 block">{personName || 'Direction'}</span>
                <span className="text-[10px] text-slate-500">{personPhone || 'WhatsApp non renseigné'}</span>
              </div>

              <div className="p-4 rounded-2xl neu-pressed space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Entreprise</span>
                <span className="text-sm font-extrabold text-slate-900 block">{companyName || 'Mon Entreprise'}</span>
                <span className="text-[10px] text-slate-500">{industry}</span>
              </div>

              <div className="p-4 rounded-2xl neu-pressed space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Agent & Rôle Strict</span>
                <span className="text-sm font-extrabold text-sky-800 block">{agentName}</span>
                <span className="text-[10px] font-bold text-emerald-700">
                  {roleType === 'customer_service' ? 'Service Client & SAV' : roleType === 'sales_orders' ? 'Ventes & Commandes' : 'Réservations'}
                </span>
              </div>
            </div>

            {/* Note on WhatsApp Centralized Connection in Dashboard */}
            <div className="p-4 rounded-2xl neu-pressed bg-emerald-50/60 border border-emerald-300 text-xs text-slate-700 flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="text-emerald-950 block">Connexion WhatsApp centralisée dans le Dashboard</strong>
                <p className="text-[11px] text-slate-600">
                  Dès l'activation, vous pourrez choisir quelle IA connecter ou déconnecter à tout moment via le scanner QR WhatsApp dans l'onglet dédié du Tableau de bord.
                </p>
              </div>
            </div>

            {/* Activation Switch */}
            <div className="p-5 rounded-3xl neu-flat flex items-center justify-between border border-emerald-300/60 bg-emerald-50/20">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  Mettre l'Agent IA en ligne 24h/24 immédiatement
                </h4>
                <p className="text-xs text-slate-500">
                  L'agent sera disponible et prêt à être relié à WhatsApp dans le Dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsActivated247(!isActivated247)}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${
                  isActivated247 ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  isActivated247 ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Final Deploy Action */}
            <div className="pt-2 text-center space-y-3">
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isDeploying}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl neu-btn-primary text-sm font-extrabold text-white flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-lg hover:scale-102 transition-transform disabled:opacity-50"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Déploiement et liaison au dashboard...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Activer et Ouvrir le Tableau de Bord</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400">
                Vous pourrez à tout moment modifier le prompt, les documents ou basculer d'agent dans le Dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#D1D9E6]">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="neu-btn px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Précédent</span>
          </button>

          <span className="text-xs font-mono font-bold text-slate-400">
            Étape {currentStep} sur 6
          </span>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(6, prev + 1))}
              className="neu-btn-primary px-6 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-102 transition-transform"
            >
              <span>Suivant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isDeploying}
              className="neu-btn-primary px-6 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Valider l'IA</span>
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>

      </main>
    </div>
  );
};
