import React, { useState } from 'react';
import { 
  Utensils, 
  ShoppingBag, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Clock,
  Check
} from 'lucide-react';

export const AutonomousActionsSection: React.FC = () => {
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);

  const actions = [
    {
      icon: Utensils,
      title: 'Réservations de Tables & Salons',
      desc: 'L\'agent vérifie la disponibilité, enregistre le nombre de couverts et confirme directement sur WhatsApp sans vous déranger.',
      tag: 'Restauration',
      delay: 'delay-100',
      demoSnippet: {
        trigger: 'Demande de disponibilité envoyée sur WhatsApp',
        action: 'Vérification du plan de salle & agenda en direct',
        result: 'Réservation enregistrée et confirmée sur WhatsApp'
      }
    },
    {
      icon: Calendar,
      title: 'Prise de Rendez-vous & Consultations',
      desc: 'Synchronisé avec votre agenda, il propose les créneaux libres et envoie les rappels automatiques la veille du RDV.',
      tag: 'Cabinets & Salons',
      delay: 'delay-200',
      demoSnippet: {
        trigger: 'Demande de créneau de rendez-vous sur WhatsApp',
        action: 'Consultation des disponibilités en temps réel',
        result: 'Créneau réservé et notification envoyée'
      }
    },
    {
      icon: ShoppingBag,
      title: 'Prise de Commandes & Ventes Directes',
      desc: 'Présente vos articles disponibles, calcule le panier et transmet la commande prête en cuisine ou en préparation.',
      tag: 'Commerces & Boutiques',
      delay: 'delay-300',
      demoSnippet: {
        trigger: 'Sélection d\'articles du catalogue sur WhatsApp',
        action: 'Vérification du stock et calcul automatique du panier',
        result: 'Commande enregistrée dans le Tableau de Bord'
      }
    },
    {
      icon: FileText,
      title: 'Factures & Devis Automatiques',
      desc: 'Génère un récapitulatif PDF clair et officiel pour chaque transaction directement envoyé dans la discussion client.',
      tag: 'B2B & Artisans',
      delay: 'delay-400',
      demoSnippet: {
        trigger: 'Demande de devis ou facture sur WhatsApp',
        action: 'Génération du récapitulatif selon vos tarifs configurés',
        result: 'Document transmis directement dans la conversation'
      }
    }
  ];

  const currentAction = actions[selectedActionIndex];
  const CurrentIcon = currentAction.icon;

  return (
    <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center space-y-2 mb-12">
        <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider inline-flex items-center gap-1.5 neu-pressed px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Capacités Opérationnelles</span>
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900">
          Ce que votre Agent IA accomplit en autonomie
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Plus qu'un simple répondeur : un véritable employé numérique capable d'exécuter des actions réelles pour votre commerce.
        </p>
      </div>

      {/* Interactive Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {actions.map((act, i) => {
          const Icon = act.icon;
          const isSelected = selectedActionIndex === i;
          return (
            <div
              key={i}
              onClick={() => setSelectedActionIndex(i)}
              className={`p-6 rounded-3xl neu-flat border transition-all cursor-pointer card-hover-interactive flex flex-col justify-between ${act.delay} animate-fade-up ${
                isSelected
                  ? 'border-sky-500 ring-2 ring-sky-400/40 shadow-xl bg-gradient-to-b from-sky-50/30 to-[#ECF0F3]'
                  : 'border-white/80 hover:border-sky-200'
              }`}
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                  isSelected ? 'neu-flat bg-sky-600 text-white shadow-md' : 'neu-pressed text-sky-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-800 uppercase neu-pill px-2.5 py-0.5 rounded-full inline-block mb-2">
                  {act.tag}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">{act.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                  {act.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-[#D1D9E6]/70 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Autonome</span>
                </span>
                <span className={`text-[10px] font-mono transition-opacity ${isSelected ? 'text-sky-700 underline font-bold' : 'text-slate-400'}`}>
                  {isSelected ? 'Actif' : 'Voir flux'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Simulation Drawer showing execution flow */}
      <div className="mt-8 p-6 rounded-3xl neu-pressed border border-white/60 animate-fade-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-flat flex items-center justify-center text-sky-600 shrink-0">
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Exécution en direct • {currentAction.tag}
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                {currentAction.title}
              </h4>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-flat text-[11px] font-mono text-emerald-800 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Zéro intervention humaine requise</span>
          </div>
        </div>

        {/* Workflow 3-Step Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#D1D9E6]">
          <div className="p-3.5 rounded-2xl neu-flat text-xs space-y-1">
            <div className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1">
              <span>1. Requête WhatsApp</span>
            </div>
            <p className="font-semibold text-slate-800">{currentAction.demoSnippet.trigger}</p>
          </div>

          <div className="p-3.5 rounded-2xl neu-flat text-xs space-y-1">
            <div className="text-[10px] text-sky-600 font-mono font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>2. Traitement IA instantané</span>
            </div>
            <p className="font-semibold text-slate-800">{currentAction.demoSnippet.action}</p>
          </div>

          <div className="p-3.5 rounded-2xl neu-flat text-xs space-y-1 bg-emerald-50/40">
            <div className="text-[10px] text-emerald-700 font-mono font-bold flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>3. Résultat & Notification</span>
            </div>
            <p className="font-semibold text-emerald-900">{currentAction.demoSnippet.result}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
