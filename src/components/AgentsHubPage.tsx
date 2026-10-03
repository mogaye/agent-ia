import React, { useState } from 'react';
import { 
  Bot, 
  Utensils, 
  ShoppingBag, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Play, 
  X,
  Send,
  Building2
} from 'lucide-react';
import { useLocale } from '../lib/i18n';

interface AgentsHubPageProps {
  onSelectTemplate: (templateName: string) => void;
}

export const AgentsHubPage: React.FC<AgentsHubPageProps> = ({ onSelectTemplate }) => {
  const { lang } = useLocale();
  const isEn = lang === 'en';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testingModel, setTestingModel] = useState<any | null>(null);
  const [testMessages, setTestMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([]);
  const [testInput, setTestInput] = useState('');
  const [isTestTyping, setIsTestTyping] = useState(false);

  const categories = [
    { id: 'all', label: isEn ? 'All' : 'Tous' },
    { id: 'Restauration', label: isEn ? 'Restaurants' : 'Restauration' },
    { id: 'E-Commerce', label: 'E-Commerce' },
    { id: 'Santé & Bien-être', label: isEn ? 'Healthcare & Spa' : 'Santé & Bien-être' },
    { id: 'Services & B2B', label: 'Services & B2B' },
    { id: 'Immobilier', label: isEn ? 'Real Estate' : 'Immobilier' }
  ];

  const models = [
    {
      id: 'resto',
      category: 'Restauration',
      categoryLabel: isEn ? 'Restaurants' : 'Restauration',
      name: isEn ? 'AI Maître d\'Hôtel & Chef' : 'Chef & Maître d\'Hôtel IA',
      industry: isEn ? 'Restaurants, Cafes & Hospitality' : 'Restaurants, Cafés & Brasseries',
      role: isEn
        ? 'Table bookings, daily menu presentation, dietary guidance, and delivery coordination on WhatsApp.'
        : 'Réservations de tables, présentation du menu du jour, gestion des régimes alimentaires et coordination livraisons.',
      icon: Utensils,
      sampleQ: isEn
        ? 'Do you have a table for 4 people this Friday at 8 PM?'
        : 'Avez-vous une table pour 4 personnes ce vendredi à 20h ?',
      sampleA: isEn
        ? 'Good evening! Yes, we have a private booth and a terrace table for 4 guests this Friday at 8:00 PM. Would you like me to confirm your booking?'
        : 'Bonsoir ! Oui, il nous reste un salon privé ainsi qu\'une table en terrasse pour 4 couverts ce vendredi à 20h00. Souhaitez-vous que je confirme votre réservation ?'
    },
    {
      id: 'shop',
      category: 'E-Commerce',
      categoryLabel: 'E-Commerce',
      name: isEn ? 'Boutique & E-Commerce Advisor' : 'Conseiller Boutique & E-Commerce',
      industry: isEn ? 'Retail, Fashion & Electronics' : 'Commerces, Prêt-à-porter & High-Tech',
      role: isEn
        ? 'Personalized product advice, live stock checks, WhatsApp shopping cart, and Wave/Orange Money/Card payment links.'
        : 'Conseils personnalisés, vérification des stocks en direct, panier d\'achat WhatsApp et envoi de liens de paiement Wave/OM.',
      icon: ShoppingBag,
      sampleQ: isEn
        ? 'Do you have the floral Ankara dress in size M in stock?'
        : 'Avez-vous la robe Ankara fleurie en taille M en stock ?',
      sampleA: isEn
        ? 'Hello! Yes, we have 3 floral Ankara dresses in size M in stock. Would you like home delivery or in-store pickup?'
        : 'Bonjour ! Oui, il nous reste 3 exemplaires de la robe Ankara fleurie en taille M (prix : 18 500 FCFA). Souhaitez-vous vous faire livrer à Dakar ou passer la récupérer en boutique ?'
    },
    {
      id: 'med',
      category: 'Santé & Bien-être',
      categoryLabel: isEn ? 'Healthcare' : 'Santé & Bien-être',
      name: isEn ? 'Medical & Wellness Coordinator' : 'Secrétaire Médical & Esthétique',
      industry: isEn ? 'Clinics, Dentists, Salons & Spas' : 'Cliniques, Dentistes, Salons de Coiffure & Spa',
      role: isEn
        ? 'Qualified appointment booking, automated WhatsApp reminders the day before, and priority triage.'
        : 'Prise de rendez-vous qualifiée, rappels WhatsApp la veille pour éviter les oublis et tri des urgences.',
      icon: Calendar,
      sampleQ: isEn
        ? 'I would like an appointment for a facial care session this Saturday.'
        : 'Je voudrais un rendez-vous pour un soin du visage ce samedi.',
      sampleA: isEn
        ? 'Hello! This Saturday, our practitioner is available at 11:15 AM and 4:30 PM. Which slot works best for you?'
        : 'Bonjour ! Ce samedi, notre praticienne est disponible à 11h15 et à 16h30 pour le soin visage éclat. Quel horaire vous conviendrait le mieux ?'
    },
    {
      id: 'b2b',
      category: 'Services & B2B',
      categoryLabel: 'Services & B2B',
      name: isEn ? 'B2B Support & Sales Agent' : 'Support Client B2B & SAV',
      industry: isEn ? 'Agencies, Contractors & B2B Services' : 'Agences, Artisans & Entreprises de Services',
      role: isEn
        ? 'Instant quotes, automated invoicing, and 24/7 answers to technical and commercial questions.'
        : 'Édition de devis préliminaires, factures instantanées et réponse automatisée aux questions techniques fréquentes.',
      icon: Bot,
      sampleQ: isEn
        ? 'Can you send me your pricing guide for web development?'
        : 'Pouvez-vous m\'envoyer votre grille tarifaire pour le développement web ?',
      sampleA: isEn
        ? 'Gladly! Here is our service brochure. Would you like to schedule a call with our project manager?'
        : 'Avec plaisir ! Voici notre documentation de prestations. Nos forfaits débutent à partir de 250 000 FCFA. Souhaitez-vous planifier un échange téléphonique avec notre chef de projet ?'
    },
    {
      id: 'immo',
      category: 'Immobilier',
      categoryLabel: isEn ? 'Real Estate' : 'Immobilier',
      name: isEn ? 'Real Estate Qualification Agent' : 'Agent de Prospection Immobilière',
      industry: isEn ? 'Real Estate Agencies & Property Management' : 'Agences Immobilières & Gestion Locative',
      role: isEn
        ? 'Buyer qualification, property brochure delivery, and automated viewing appointments.'
        : 'Qualification des critères de recherche des acquéreurs, transmission des fiches de biens et planification des visites.',
      icon: Building2,
      sampleQ: isEn
        ? 'I am looking for a 2-bedroom apartment in Almadies.'
        : 'Je cherche un appartement 3 pièces aux Almadies.',
      sampleA: isEn
        ? 'Hello! We currently have 2 ocean-view apartments available in Almadies. What is your approximate monthly budget?'
        : 'Bonjour ! Nous avons actuellement 2 appartements F3 disponibles aux Almadies avec vue mer et groupe électrogène. Quel est votre budget mensuel approximatif ?'
    }
  ];

  const filteredModels = selectedCategory === 'all' 
    ? models 
    : models.filter(m => m.category === selectedCategory);

  const handleOpenTest = (model: typeof models[0]) => {
    setTestingModel(model);
    setTestMessages([
      {
        sender: 'agent',
        text: isEn
          ? `Hello! I am the "${model.name}" template. Ask me a typical customer question!`
          : `Bonjour ! Je suis le modèle « ${model.name} ». Posez-moi une question typique de vos clients !`
      }
    ]);
  };

  const handleSendTestMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim() || isTestTyping || !testingModel) return;

    const userMsg = testInput.trim();
    setTestInput('');
    setTestMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsTestTyping(true);

    setTimeout(() => {
      setTestMessages(prev => [
        ...prev, 
        { sender: 'agent', text: testingModel.sampleA }
      ]);
      setIsTestTyping(false);
    }, 600);
  };

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-8 sm:space-y-10 bg-white">
      {/* Header section */}
      <div className="text-center space-y-3 animate-fade-down">
        <span className="text-xs font-mono font-bold text-[#0052CC] uppercase tracking-wider inline-flex items-center gap-1.5 bg-[#EBF2FF] border border-[#0052CC]/15 px-3.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-[#0052CC]" />
          <span>{isEn ? 'Specialized AI Agent Catalog' : 'Catalogue de Modèles Spécialisés'}</span>
        </span>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#0A0A0A] font-display tracking-tight">
          {isEn ? 'Choose Your AI Agent Template' : 'Choisissez votre modèle d\'Agent IA'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
          {isEn
            ? 'Each template is pre-trained for its industry, connected to WhatsApp QR, and ready to be customized.'
            : 'Chaque modèle est déjà instruit pour son secteur d\'activité, connecté à WhatsApp et prêt à être personnalisé.'}
        </p>
      </div>

      {/* Category filter pills in a clean grid on mobile, flex on desktop */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 animate-fade-up">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0052CC] text-white shadow-sm'
                  : 'bg-[#F8FAFC] text-slate-700 border border-slate-200 hover:border-[#0052CC]/40'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Symmetrical Grid of Agent Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredModels.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div 
              key={m.id} 
              className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#0052CC]/30 transition-all flex flex-col justify-between animate-fade-up"
              style={{ animationDelay: `${(idx + 1) * 80}ms` }}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#0052CC] uppercase bg-[#EBF2FF] px-3 py-1 rounded-full">
                    {m.categoryLabel}
                  </span>
                </div>

                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  {m.industry}
                </span>
                <h3 className="text-base font-extrabold text-[#0A0A0A] mt-1">{m.name}</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                  {m.role}
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-4 mt-5 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenTest(m)}
                  className="py-2.5 px-3 rounded-full bg-[#F8FAFC] hover:bg-[#EBF2FF] border border-slate-200 text-xs font-extrabold text-slate-800 hover:text-[#0052CC] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-[#0052CC]" />
                  <span>{isEn ? 'Live Preview' : 'Aperçu direct'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTemplate(m.name)}
                  className="py-2.5 px-3 rounded-full bg-[#0052CC] hover:bg-[#003E99] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <span>{isEn ? 'Deploy' : 'Activer'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Live Testing Modal */}
      {testingModel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setTestingModel(null)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xl animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF2FF] flex items-center justify-center text-[#0052CC]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0A0A0A]">{testingModel.name}</h3>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isEn ? 'Online on WhatsApp' : 'En ligne sur WhatsApp'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setTestingModel(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick test prompt button */}
            <div className="p-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 text-xs flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-600 truncate">« {testingModel.sampleQ} »</span>
              <button
                type="button"
                onClick={() => setTestInput(testingModel.sampleQ)}
                className="bg-[#EBF2FF] px-3 py-1 rounded-full text-[10px] font-extrabold text-[#0052CC] shrink-0 cursor-pointer"
              >
                {isEn ? 'Use sample' : 'Injecter'}
              </button>
            </div>

            {/* Chat conversation area */}
            <div className="h-56 overflow-y-auto space-y-2.5 p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/60">
              {testMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#0052CC] text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTestTyping && (
                <div className="flex items-center gap-1 p-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 w-16">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 typing-dot-3" />
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendTestMessage} className="flex gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder={isEn ? 'Ask this AI Agent a question...' : 'Posez une question à cet Agent IA...'}
                className="flex-1 min-w-0 bg-[#F8FAFC] border border-slate-200 px-3.5 py-2.5 rounded-full text-xs text-slate-800 focus:outline-none focus:border-[#0052CC]"
              />
              <button
                type="submit"
                disabled={!testInput.trim() || isTestTyping}
                className="bg-[#0052CC] text-white px-4 py-2.5 rounded-full text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono truncate">
                {isEn ? 'Ready for your WhatsApp number' : 'Prêt pour votre numéro WhatsApp'}
              </span>
              <button
                onClick={() => {
                  setTestingModel(null);
                  onSelectTemplate(testingModel.name);
                }}
                className="bg-[#0A0A0A] hover:bg-[#0052CC] text-white px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
              >
                <span>{isEn ? 'Use this template' : 'Adopter ce modèle'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
