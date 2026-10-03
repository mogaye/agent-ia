import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  X, 
  Bot, 
  ShieldCheck, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { EnterpriseAgent } from '../types';
import { api } from '../lib/api';

interface WhatsAppWebModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentsList: EnterpriseAgent[];
  selectedAgentId: string;
  onSelectAgent: (id: string) => void;
  onConfirmConnected: (agentId: string) => void;
  liveQrImage: string | null;
  onRefreshQr: () => void;
  isFetchingQr: boolean;
  countdown: number;
  functionRole?: 'admin_otp' | 'company_agent';
}

export const WhatsAppWebModal: React.FC<WhatsAppWebModalProps> = ({
  isOpen,
  onClose,
  agentsList,
  selectedAgentId,
  onSelectAgent,
  onConfirmConnected,
  liveQrImage,
  onRefreshQr,
  isFetchingQr,
  countdown,
  functionRole = 'company_agent'
}) => {
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [pairingMethod, setPairingMethod] = useState<'qr' | 'phone'>('qr');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCodeGenerated, setPairingCodeGenerated] = useState<string | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isGeneratingPairingCode, setIsGeneratingPairingCode] = useState(false);

  const selectedAgent: EnterpriseAgent = agentsList.find(a => a.id === selectedAgentId) || agentsList[0] || {
    id: 'default',
    name: 'Agent IA',
    roleType: 'customer_service',
    roleTitle: 'Agent WhatsApp',
    description: '',
    welcomeMessage: '',
    channels: ['whatsapp'],
    whatsappNumber: '',
    whatsappStatus: 'disconnected',
    status: 'active',
    knowledgeText: '',
    promptInstruction: '',
    conversationsCount: 0,
    createdAt: ''
  };
  const isAgentConnected = selectedAgent?.whatsappStatus === 'connected';

  // Rafraîchissement temps réel toutes les 2.5 secondes pour détecter le scan immédiatement
  // et mettre à jour le QR Code dès que Baileys le renouvelle (toutes les 20s)
  useEffect(() => {
    if (isOpen) {
      onRefreshQr();
      const interval = setInterval(() => {
        onRefreshQr();
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedAgentId]);

  if (!isOpen) return null;

  const handleGeneratePhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setIsGeneratingPairingCode(true);
    setPairingError(null);
    setPairingCodeGenerated(null);

    try {
      const token = api.getToken();
      const res = await fetch('/api/whatsapp/pairing-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          agentId: selectedAgent?.id || 'default',
          role: functionRole
        })
      });
      const data = await res.json();
      if (data.success && data.pairingCode) {
        setPairingCodeGenerated(data.pairingCode);
      } else {
        setPairingError(data.error || "Impossible de générer le code d'appairage. Utilisez le scan QR Code.");
      }
    } catch (_) {
      setPairingError("Erreur de communication avec le serveur Baileys WhatsApp.");
    } finally {
      setIsGeneratingPairingCode(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* WhatsApp Web Container */}
      <div className="w-full max-w-4xl bg-[#f0f2f5] rounded-3xl shadow-2xl overflow-hidden border border-slate-300 flex flex-col my-auto">
        
        {/* Authentic WhatsApp Web Top Banner */}
        <div className="bg-[#00a884] px-6 py-4 flex items-center justify-between text-white shadow-md">
          <div className="flex items-center gap-3">
            {/* Official WhatsApp Logo SVG */}
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-[#00a884]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {functionRole === 'admin_otp' ? 'WHATSAPP SERVEUR BAILEYS — AUTHENTIFICATION ADMIN' : 'WHATSAPP SERVEUR BAILEYS — CONNEXION AGENT IA'}
              </h2>
              <span className="text-[11px] text-emerald-100 font-medium">
                {functionRole === 'admin_otp'
                  ? 'Fonction 1 : Envoi sécurisé des codes OTP et authentification de connexion'
                  : 'Fonction 2 : Liaison directe de votre Agent IA et de sa base documentaire à WhatsApp'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href="https://web.whatsapp.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>web.whatsapp.com</span>
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Agent Assignment Selector Bar */}
        <div className="bg-[#e9edef] px-6 py-2.5 border-b border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#00a884]" />
            <span className="font-bold text-slate-800">Agent IA à connecter à ce numéro WhatsApp :</span>
            <select
              value={selectedAgentId}
              onChange={(e) => onSelectAgent(e.target.value)}
              className="px-3 py-1 rounded-lg bg-white border border-slate-300 font-bold text-slate-900 cursor-pointer shadow-xs focus:ring-2 focus:ring-[#00a884] focus:outline-hidden"
            >
              {agentsList.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.roleTitle}) — {a.whatsappStatus === 'connected' ? '✓ Connecté' : 'Prêt à scanner'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-600 font-semibold">
              Rôle : <span className="text-emerald-700 font-bold">{selectedAgent.roleTitle}</span>
            </span>
          </div>
        </div>

        {/* Authentic WhatsApp Web White Box */}
        <div className="p-6 sm:p-10 bg-white m-3 sm:m-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Official WhatsApp Web Instructions */}
            <div className="md:col-span-7 space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-normal text-[#41525d] font-sans">
                  Utiliser WhatsApp sur votre ordinateur
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Connectez votre compte WhatsApp pour permettre à <strong className="text-slate-800 font-bold">{selectedAgent.name}</strong> de répondre 24h/24 aux clients.
                </p>
              </div>

              {pairingMethod === 'qr' ? (
                <ol className="space-y-4 text-sm sm:text-base text-[#3b4a54] leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-slate-800 shrink-0">1.</span>
                    <span>Ouvrez <strong>WhatsApp</strong> sur votre téléphone</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-slate-800 shrink-0">2.</span>
                    <span>
                      Appuyez sur <strong>Menu ⋮</strong> sur Android, ou sur <strong>Réglages ⚙️</strong> sur iPhone
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-slate-800 shrink-0">3.</span>
                    <span>
                      Appuyez sur <strong>Appareils connectés</strong>, puis sur <strong>Connecter un appareil</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-slate-800 shrink-0">4.</span>
                    <span>
                      Pointez votre téléphone vers cet écran pour <strong>capturer le code QR</strong> (la connexion se valide automatiquement dès le scan)
                    </span>
                  </li>
                </ol>
              ) : (
                <form onSubmit={handleGeneratePhoneCode} className="space-y-4">
                  <p className="text-sm text-slate-700">
                    Saisissez votre numéro de téléphone au format international (ex: <strong>+221 77...</strong>) pour recevoir un code de jumelage à 8 caractères :
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+221 77 000 00 00"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#00a884] focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={isGeneratingPairingCode}
                      className="px-5 py-2.5 rounded-xl bg-[#00a884] text-white font-bold text-xs hover:bg-[#008f6f] cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isGeneratingPairingCode ? 'Génération...' : 'Obtenir le code'}
                    </button>
                  </div>

                  {pairingError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                      {pairingError}
                    </div>
                  )}

                  {pairingCodeGenerated && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-fadeIn">
                      <span className="text-xs text-emerald-800 font-bold block">
                        Votre code de jumelage officiel Baileys :
                      </span>
                      <div className="font-mono text-2xl font-extrabold tracking-widest text-emerald-700 bg-white py-2 px-4 rounded-lg inline-block border border-emerald-300">
                        {pairingCodeGenerated}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Sur votre téléphone, ouvrez WhatsApp &gt; Appareils connectés &gt; Lier avec un numéro de téléphone, puis tapez ce code.
                      </p>
                    </div>
                  )}
                </form>
              )}

              {/* Options & Footer links */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="stayLoggedIn"
                    checked={stayLoggedIn}
                    onChange={(e) => setStayLoggedIn(e.target.checked)}
                    className="w-4 h-4 rounded text-[#00a884] focus:ring-[#00a884] cursor-pointer"
                  />
                  <label htmlFor="stayLoggedIn" className="text-xs text-slate-600 font-medium cursor-pointer">
                    Maintenir la connexion 24/7 sur ce serveur
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPairingMethod(pairingMethod === 'qr' ? 'phone' : 'qr');
                      setPairingCodeGenerated(null);
                    }}
                    className="text-[#00a884] hover:text-[#008f6f] font-bold underline cursor-pointer"
                  >
                    {pairingMethod === 'qr' ? 'Lier avec un numéro de téléphone' : 'Lier avec le code QR'}
                  </button>

                  <a
                    href="https://faq.whatsapp.com/1317564962415621"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Besoin d'aide pour vous connecter ?</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic High-Contrast Unobstructed WhatsApp Web QR Code Frame */}
            <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
              <div className="relative w-68 h-68 sm:w-76 sm:h-76 bg-white p-2 rounded-2xl shadow-lg border-2 border-slate-200 flex flex-col items-center justify-center overflow-hidden">
                {isAgentConnected ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 bg-emerald-50 w-full h-full rounded-xl animate-fadeIn">
                    <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-bounce" />
                    <h4 className="text-base font-extrabold text-emerald-950">
                      WhatsApp Connecté !
                    </h4>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-200">
                      {selectedAgent.whatsappNumber || 'Session Active'}
                    </span>
                    <p className="text-[11px] text-slate-600">
                      L'agent <strong>{selectedAgent.name}</strong> est désormais en ligne 24/7 sur WhatsApp.
                    </p>
                  </div>
                ) : liveQrImage ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-white">
                    <img 
                      src={liveQrImage} 
                      alt="Code QR WhatsApp Web Officiel" 
                      className="w-full h-full object-contain select-none"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <Loader2 className="w-10 h-10 animate-spin text-[#00a884]" />
                    <span className="text-xs font-bold text-slate-700">Génération du QR Code WhatsApp...</span>
                  </div>
                )}
              </div>

              {/* Refresh / Timer Control */}
              {!isAgentConnected && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onRefreshQr}
                    disabled={isFetchingQr}
                    className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingQr ? 'animate-spin text-[#00a884]' : ''}`} />
                    <span>Actualiser le code</span>
                  </button>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                     Synchronisation auto ({countdown}s)
                  </span>
                </div>
              )}

              {/* Validation / Close button */}
              <button
                type="button"
                onClick={() => {
                  if (isAgentConnected) {
                    onClose();
                  } else {
                    onConfirmConnected(selectedAgent.id);
                  }
                }}
                className="w-full max-w-xs py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isAgentConnected
                    ? `Terminer (${selectedAgent.name} est connecté)`
                    : `Vérifier la connexion WhatsApp (${selectedAgent.name})`}
                </span>
              </button>
            </div>

          </div>
        </div>

        {/* Security / Encryption Notice */}
        <div className="px-6 py-3 bg-[#f0f2f5] text-center text-xs text-slate-500 flex items-center justify-center gap-2 border-t border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Vos messages personnels et professionnels sont protégés par le chiffrement de bout en bout de WhatsApp.</span>
        </div>

      </div>
    </div>
  );
};
