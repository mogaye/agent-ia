import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  CheckCircle,
  MessageSquare,
  CheckCheck,
  Send,
  Calendar,
  CreditCard,
  Package
} from 'lucide-react';
import { WaveIcon, OrangeMoneyIcon } from './PaymentLogos.tsx';

interface HeroSectionProps {
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onExploreAgents: () => void;
  onCreateAgent?: () => void;
  onDirectDashboard?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenAuth,
  onExploreAgents,
  onCreateAgent,
  onDirectDashboard
}) => {
  // Interactive mini simulation in the hero
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [simMessages, setSimMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string; actionBadge?: string }>>([
    {
      sender: 'bot',
      text: 'Bonjour ! Bienvenue chez SMG Flow. Je suis votre Agent IA connecté 24/7 à WhatsApp. Comment puis-je vous aider aujourd\'hui ?',
      time: '12:00'
    }
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const samplePrompts = [
    { label: '📅 Réserver pour ce soir à 20h (4 personnes)', reply: 'Parfait ! J\'ai enregistré votre table pour 4 personnes à 20h00. Un SMS de confirmation et le rappel WhatsApp vous ont été transmis.', badge: 'Réservation validée' },
    { label: '📦 Consulter les tarifs et commander', reply: 'Voici notre formule PRO à 25 000 FCFA/mois incluant 15 000 crédits IA et le connecteur WhatsApp dédié. Souhaitez-vous le lien de paiement ?', badge: 'Catalogue interactif' },
    { label: '🌊 Payer ma facture via Wave', reply: 'Bien noté ! Voici le lien de règlement sécurisé PayDunya pour votre compte. La validation est instantanée sans commission intermédiaire.', badge: 'Encaissement Wave/OM' }
  ];

  const handleSelectPrompt = (prompt: typeof samplePrompts[0]) => {
    if (isBotTyping) return;
    setActivePrompt(prompt.label);
    
    // Add user message immediately
    setSimMessages(prev => [
      ...prev,
      { sender: 'user', text: prompt.label, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    
    setIsBotTyping(true);
    
    // Simulate AI thinking and typing response
    setTimeout(() => {
      setSimMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: prompt.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionBadge: prompt.badge
        }
      ]);
      setIsBotTyping(false);
      setActivePrompt(null);
    }, 700);
  };

  return (
    <section className="relative pt-10 pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-sky-400/10 via-indigo-400/10 to-emerald-400/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto text-center space-y-7 relative z-10">
        
        {/* Top Badge (Stagger 1) */}
        <div className="animate-fade-down delay-100 inline-flex items-center gap-2 px-4 py-1.5 rounded-full neu-flat text-xs font-bold text-sky-800 border border-sky-300/40 shadow-xs hover:scale-102 transition-transform cursor-default">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow" />
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Plateforme Multi-Agents IA & Passerelle WhatsApp Autonome</span>
        </div>

        {/* Main Heading (Stagger 2) */}
        <h1 className="animate-fade-up delay-150 text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight font-display leading-[1.15]">
          Votre Entreprise Pilotée par <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600">
            un Agent IA Autonome 24/7
          </span>
        </h1>

        {/* Subtitle (Stagger 3) */}
        <p className="animate-fade-up delay-200 max-w-2xl mx-auto text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
          Déployez un conseiller virtuel relié à votre compte WhatsApp, vos réservations, commandes et base de connaissances privée, sans configuration technique complexe.
        </p>

        {/* CTA Buttons (Stagger 4) */}
        <div className="animate-fade-up delay-250 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          {onDirectDashboard && (
            <button
              onClick={onDirectDashboard}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#00a884] hover:bg-[#008f6f] text-white text-sm font-extrabold flex items-center justify-center gap-2.5 cursor-pointer shadow-xl hover:scale-102 active:scale-98 transition-all"
            >
              <Smartphone className="w-5 h-5" />
              <span>Accéder au Tableau de Bord & WhatsApp Web</span>
            </button>
          )}
          <button
            onClick={() => onCreateAgent ? onCreateAgent() : onOpenAuth('register')}
            className="w-full sm:w-auto neu-btn-primary px-7 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-102 active:scale-98 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Créer mon Agent IA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreAgents}
            className="w-full sm:w-auto neu-btn px-6 py-4 rounded-2xl text-sm font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-sky-600" />
            <span>Nos Modèles</span>
          </button>
        </div>

        {/* Guarantees Badges (Stagger 5) */}
        <div className="animate-fade-up delay-300 pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Passerelle WhatsApp en 10 secondes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Sans engagement de durée</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Données isolées en coffre crypté</span>
          </div>
        </div>

        {/* INTERACTIVE LIVE WHATSAPP AGENT SIMULATION (Stagger 6 + Floating Badges) */}
        <div className="animate-fade-up delay-350 pt-8 relative max-w-2xl mx-auto text-left">
          
          {/* Floating badge left */}
          <div className="hidden lg:flex absolute -left-24 top-16 items-center gap-2 p-3 rounded-2xl neu-flat animate-float shadow-md text-xs font-bold text-slate-700 border border-white/80 z-20">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Temps de réponse</div>
              <div className="text-emerald-700 font-mono font-extrabold">&lt; 0.3 seconde</div>
            </div>
          </div>

          {/* Floating badge right */}
          <div className="hidden lg:flex absolute -right-24 bottom-12 items-center gap-2 p-3 rounded-2xl neu-flat animate-float-reverse shadow-md text-xs font-bold text-slate-700 border border-white/80 z-20">
            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">Paiement certifié</div>
              <div className="text-sky-700 font-bold flex items-center gap-1">
                <span>Wave & OM</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* WhatsApp Interactive Frame */}
          <div className="rounded-3xl neu-flat-lg border border-white/90 overflow-hidden shadow-2xl transition-all">
            {/* Top WhatsApp Bar */}
            <div className="bg-[#075E54] text-white p-3.5 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center border-2 border-emerald-400 font-extrabold text-sm text-white">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#075E54] animate-pulse-glow" />
                </div>
                <div>
                  <div className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                    <span>Agent IA MsgFlow</span>
                    <span className="text-[10px] bg-emerald-600/80 px-1.5 py-0.2 rounded font-mono font-normal">Officiel</span>
                  </div>
                  <div className="text-[11px] text-emerald-200 flex items-center gap-1">
                    <span>En ligne</span>
                    <span>•</span>
                    <span>Traitement autonome 24h/24</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono bg-white/10 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Aperçu en direct</span>
              </div>
            </div>

            {/* Conversation Flow Area */}
            <div className="bg-[#EFEAE2] p-4 sm:p-5 min-h-[220px] max-h-[300px] overflow-y-auto space-y-3">
              {simMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-up`}
                >
                  <div 
                    className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs relative ${
                      msg.sender === 'user' 
                        ? 'bg-[#E7FFDB] text-slate-800 rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.actionBadge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 font-mono mb-1.5">
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        {msg.actionBadge}
                      </span>
                    )}
                    <p className="font-medium">{msg.text}</p>
                    <div className="text-[9px] text-slate-400 text-right mt-1 flex items-center justify-end gap-1 font-mono">
                      <span>{msg.time}</span>
                      {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-sky-600" />}
                    </div>
                  </div>
                </div>
              ))}

              {/* Bot typing simulation indicator */}
              {isBotTyping && (
                <div className="flex items-start gap-1 p-3 rounded-2xl rounded-tl-none bg-white text-slate-600 text-xs shadow-xs w-20 animate-fade-in">
                  <div className="flex items-center gap-1 py-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-1" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-2" />
                    <span className="w-2 h-2 rounded-full bg-slate-400 typing-dot-3" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick interactive prompts (chips) */}
            <div className="bg-[#ECF0F3] p-3 border-t border-[#D1D9E6] space-y-2">
              <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between px-1">
                <span>Sélectionnez une demande client type :</span>
                <span className="text-[10px] text-sky-700 font-mono">Temps réel</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPrompt(p)}
                    disabled={isBotTyping}
                    className="neu-flat px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 hover:text-sky-800 hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50 text-left flex items-center gap-1.5"
                  >
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
