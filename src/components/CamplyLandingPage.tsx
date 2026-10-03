import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Bot,
  QrCode,
  ShieldCheck,
  Database,
  ShoppingBag,
  Calendar,
  CreditCard,
  MessageSquare,
  Send,
  Search,
  Compass,
  Utensils,
  Stethoscope,
  CheckCircle2,
  ChevronRight,
  Layers,
  FileText,
  Smartphone,
  RefreshCw,
  Globe
} from 'lucide-react';
import { api } from '../lib/api';
import { useLocale } from '../lib/i18n';

interface CamplyLandingPageProps {
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onCreateAgent: () => void;
  onDirectDashboard?: () => void;
  onExploreAgents: () => void;
  onNavigateHowItWorks: () => void;
  onNavigatePricing: () => void;
}

/**
 * Reusable Scroll-Reveal Choreography Wrapper
 */
const RevealOnScroll: React.FC<{
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale-pop';
  delayMs?: number;
  className?: string;
  threshold?: number;
}> = ({
  children,
  animation = 'fade-up',
  delayMs = 0,
  className = '',
  threshold = 0.12
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const getInitialTransform = () => {
    switch (animation) {
      case 'fade-up':
        return 'translate-y-8 opacity-0';
      case 'fade-down':
        return '-translate-y-6 opacity-0';
      case 'fade-left':
        return '-translate-x-6 sm:-translate-x-10 opacity-0';
      case 'fade-right':
        return 'translate-x-6 sm:translate-x-10 opacity-0';
      case 'scale-pop':
        return 'scale-90 opacity-0';
      default:
        return 'translate-y-6 opacity-0';
    }
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        isVisible ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : getInitialTransform()
      } ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Camply Signature 3-Ray Sparkle Burst SVG Accent
 */
const SparkleBurst: React.FC<{ color?: string; className?: string }> = ({
  color = '#0052CC',
  className = 'w-6 h-6 sm:w-7 sm:h-7'
}) => (
  <svg
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path d="M6 16L16 6" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M12 24L28 12" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M18 30L31 24" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const CamplyLandingPage: React.FC<CamplyLandingPageProps> = ({
  onCreateAgent,
  onDirectDashboard,
  onExploreAgents,
  onNavigateHowItWorks,
  onNavigatePricing
}) => {
  const { lang, currency } = useLocale();
  const isEn = lang === 'en';
  const livePhoneRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // ACT 1: HERO SMARTPHONE SIMULATION STATE
  // ============================================================================
  const [heroMessages, setHeroMessages] = useState<
    Array<{ sender: 'user' | 'bot'; text: string; tag?: string }>
  >([]);
  const [heroTyping, setHeroTyping] = useState(false);

  useEffect(() => {
    setHeroMessages([
      {
        sender: 'bot',
        text: isEn
          ? 'Hello! I am your SMG Flow AI Agent connected to WhatsApp. What would you like to automate today?'
          : 'Bonjour ! Je suis votre Agent IA SMG Flow connecté à WhatsApp. Que souhaitez-vous automatiser ?',
        tag: isEn ? 'Online' : 'En ligne'
      }
    ]);
  }, [isEn]);

  const heroQuickScenarios = isEn
    ? [
        {
          label: 'Order a product',
          reply:
            'Your cart has been created automatically. Would you like to pay by Card, Wave, or Orange Money?',
          tag: 'Order'
        },
        {
          label: 'Book a slot',
          reply:
            'Your time slot is available! The booking is now synced with the company calendar.',
          tag: 'Booking'
        },
        {
          label: 'Payment Link',
          reply:
            'Here is your secure payment link compatible with Visa, Mastercard, Wave, and Orange Money.',
          tag: 'Payment'
        }
      ]
    : [
        {
          label: 'Commander un produit',
          reply:
            'Votre panier a été créé automatiquement. Souhaitez-vous régler par Carte, Wave ou Orange Money ?',
          tag: 'Commande'
        },
        {
          label: 'Réserver un créneau',
          reply:
            'Votre créneau est disponible ! La réservation est enregistrée dans l\'agenda de l\'entreprise.',
          tag: 'Agenda'
        },
        {
          label: 'Lien Paiement',
          reply:
            'Voici votre lien de règlement sécurisé compatible Visa, Mastercard, Wave et Orange Money.',
          tag: 'Paiement'
        }
      ];

  const handleHeroScenario = (scenario: (typeof heroQuickScenarios)[0]) => {
    if (heroTyping) return;
    setHeroMessages((prev) => [...prev, { sender: 'user', text: scenario.label }]);
    setHeroTyping(true);
    setTimeout(() => {
      setHeroMessages((prev) => [
        ...prev,
        { sender: 'bot', text: scenario.reply, tag: scenario.tag }
      ]);
      setHeroTyping(false);
    }, 550);
  };

  // ============================================================================
  // ACT 4: SECTOR & MISSION FINDER STATE
  // ============================================================================
  const [selectedSectorKey, setSelectedSectorKey] = useState<'resto' | 'ecom' | 'med' | 'b2b'>('resto');
  const [selectedMissionIndex, setSelectedMissionIndex] = useState(0);
  const [finderConfirmed, setFinderConfirmed] = useState(false);

  const missionsList = isEn
    ? ['Orders & Shopping Carts', 'Bookings & Calendar', '24/7 Customer Support & FAQ', 'Global & Mobile Payments']
    : ['Commandes & Paniers', 'Réservations & Agenda', 'Support Client & FAQ 24/7', 'Paiements CB, Wave & OM'];

  const sectorRecommendations = {
    resto: {
      label: isEn ? 'Restaurants & Delivery' : 'Restauration & Livraison',
      shortSub: isEn ? 'Menus & Orders' : 'Menus & Livraisons',
      title: isEn
        ? 'Interactive Menu & Order Taking AI Agent'
        : 'Agent IA Prise de Commandes & Menu Interactif',
      desc: isEn
        ? 'Presents your menu on WhatsApp, calculates the cart total, collects delivery details, and sends a secure payment link.'
        : 'Présente votre carte sur WhatsApp, calcule le panier, récupère l\'adresse de livraison et envoie le lien d\'encaissement sécurisé.',
      modules: isEn
        ? ['Menu & Catalog', 'Cart Calculation', 'Instant Checkout']
        : ['Menu & Catalogue', 'Calcul Panier', 'Paiement Intégré']
    },
    ecom: {
      label: isEn ? 'Retail & E-Commerce' : 'Boutiques & E-Commerce',
      shortSub: isEn ? 'Catalog & Carts' : 'Catalogue & Paniers',
      title: isEn
        ? '24/7 Sales Advisor & Catalog AI Agent'
        : 'Agent IA Conseiller de Vente & Catalogue 24/7',
      desc: isEn
        ? 'Guides customers to the right products, checks availability from your knowledge base, and validates orders autonomously.'
        : 'Oriente vos clients vers les bons articles, vérifie la disponibilité dans votre base documentaire et valide les commandes sans intervention humaine.',
      modules: isEn
        ? ['Product Catalog', 'Lead Qualification', 'Payment Link']
        : ['Catalogue Produits', 'Qualification Client', 'Lien d\'Encaissement']
    },
    med: {
      label: isEn ? 'Clinics, Salons & Bookings' : 'Cliniques, Salons & RDV',
      shortSub: isEn ? 'Calendar Sync' : 'Gestion d\'Agenda',
      title: isEn
        ? 'Receptionist & Calendar Management AI Agent'
        : 'Agent IA Réceptionniste & Gestion d\'Agenda',
      desc: isEn
        ? 'Proposes available slots, records appointments for your patients or clients, and answers practical questions 24/7.'
        : 'Propose les créneaux disponibles, enregistre les réservations de vos patients ou clients et répond aux questions pratiques.',
      modules: isEn
        ? ['Live Calendar', 'Booking Confirmation', 'Business FAQ']
        : ['Agenda Temps Réel', 'Confirmation RDV', 'FAQ Métier']
    },
    b2b: {
      label: isEn ? 'Real Estate, Schools & B2B' : 'Immobilier, Écoles & Services',
      shortSub: isEn ? 'Private Vault' : 'Base Documentaire',
      title: isEn
        ? 'Customer Support & Private Knowledge AI Agent'
        : 'Agent IA Support & Base Documentaire Privée',
      desc: isEn
        ? 'Answers pricing requests, enrollment questions, or property inquiries instantly using your uploaded official documents.'
        : 'Répond instantanément aux demandes de tarifs, dossiers d\'inscription ou visites à partir de vos documents officiels importés.',
      modules: isEn
        ? ['Document Vault', 'Lead Capture', '24/7 Multilingual']
        : ['Coffre Documentaire', 'Prise de Contact', 'Multilingue 24/7']
    }
  };

  const activeRecommendation = sectorRecommendations[selectedSectorKey];

  // ============================================================================
  // ACT 5: RADIAL ECOSYSTEM ACTIVE NODE STATE
  // ============================================================================
  const [activeOrbitIndex, setActiveOrbitIndex] = useState<number>(0);

  const orbitNodes = [
    {
      title: isEn ? 'WhatsApp QR Gateway' : 'Passerelle WhatsApp QR',
      shortLabel: 'WhatsApp',
      desc: isEn
        ? 'Direct connection of your business WhatsApp number in any country (+1, +33, +221, +44...) via secure QR scan.'
        : 'Connexion directe de votre numéro WhatsApp professionnel dans tous les pays (+221, +33, +1, +225...) par simple scan QR Code.',
      icon: QrCode,
      angleDeg: -90
    },
    {
      title: isEn ? 'Catalog & Menus' : 'Catalogue & Menus',
      shortLabel: isEn ? 'Catalog' : 'Catalogue',
      desc: isEn
        ? 'Synchronize your products, services, and multi-currency pricing tables to inform customers accurately.'
        : 'Synchronisation de vos produits, services et grilles tarifaires pour renseigner vos clients.',
      icon: ShoppingBag,
      angleDeg: -30
    },
    {
      title: isEn ? 'Calendar & Bookings' : 'Agenda & Réservations',
      shortLabel: isEn ? 'Bookings' : 'Agenda',
      desc: isEn
        ? 'Autonomous scheduling of appointments, tables, and time slots with zero double-booking.'
        : 'Planification autonome des rendez-vous, tables et créneaux horaires sans double réservation.',
      icon: Calendar,
      angleDeg: 30
    },
    {
      title: isEn ? 'Global & Mobile Payments' : 'Paiements CB, Wave & OM',
      shortLabel: isEn ? 'Payments' : 'Paiements',
      desc: isEn
        ? 'Automatic generation of certified payment links (Visa, Mastercard, Wave, Orange Money).'
        : 'Génération automatique de liens de paiement certifiés (Visa, Mastercard, Wave, Orange Money).',
      icon: CreditCard,
      angleDeg: 90
    },
    {
      title: isEn ? 'Private Knowledge Vault' : 'Coffre Documentaire',
      shortLabel: isEn ? 'Documents' : 'Documents',
      desc: isEn
        ? 'Train your agent on your own documents, FAQs, and business rules isolated in an encrypted vault.'
        : 'Entraînement sur vos propres documents, FAQ et consignes métier isolés en espace privé.',
      icon: Database,
      angleDeg: 150
    },
    {
      title: isEn ? 'Order & Chat Tracking' : 'Suivi & Commandes',
      shortLabel: isEn ? 'Orders' : 'Commandes',
      desc: isEn
        ? 'Real-time centralization of all incoming orders, reservations, and conversations on your dashboard.'
        : 'Centralisation en temps réel de toutes les commandes et conversations sur votre tableau de bord.',
      icon: Layers,
      angleDeg: 210
    }
  ];

  // ============================================================================
  // ACT 6: CENTRAL PHONE LIVE AI CHAT
  // ============================================================================
  const [liveChatMessages, setLiveChatMessages] = useState<
    Array<{ sender: 'user' | 'bot'; text: string }>
  >([]);
  const [liveChatInput, setLiveChatInput] = useState('');
  const [liveChatLoading, setLiveChatLoading] = useState(false);

  useEffect(() => {
    setLiveChatMessages([
      {
        sender: 'bot',
        text: isEn
          ? 'Hello! Ask me a question or test an order live to see how I reply to your customers on WhatsApp in any language.'
          : 'Bonjour ! Posez-moi une question ou testez une commande en direct pour voir comment je réponds à vos clients sur WhatsApp.'
      }
    ]);
  }, [isEn]);

  const handleSendLiveChat = async (e?: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const messageToSend = (presetText ?? liveChatInput).trim();
    if (!messageToSend || liveChatLoading) return;

    if (presetText && livePhoneRef.current && window.innerWidth < 1024) {
      livePhoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (!presetText) setLiveChatInput('');
    setLiveChatMessages((prev) => [...prev, { sender: 'user', text: messageToSend }]);
    setLiveChatLoading(true);

    try {
      const response = await api.post('/api/ai/chat', {
        message: messageToSend,
        companyName: 'SMG Flow',
        agentName: isEn ? 'SMG Flow AI Assistant' : 'Assistant SMG Flow',
        knowledgeBase:
          'SMG Flow is an international platform allowing businesses to create autonomous WhatsApp AI agents connected via QR Code, handling orders, bookings, private knowledge bases, and payments (Visa, Mastercard, Wave, Orange Money).'
      });

      const replyText =
        response?.reply ||
        (isEn
          ? 'I assist your customers 24/7 on WhatsApp: presenting your catalog, taking orders, booking appointments, and sending payment links.'
          : 'Je prends en charge vos clients 24h/24 sur WhatsApp : présentation du catalogue, prise de commandes, réservations de créneaux et liens de paiement.');

      setLiveChatMessages((prev) => [...prev, { sender: 'bot', text: replyText }]);
    } catch {
      setLiveChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: isEn
            ? 'I am active 24/7 to automate your WhatsApp replies, record orders, and schedule bookings.'
            : 'Je suis opérationnel 24h/24 pour automatiser vos réponses WhatsApp, enregistrer vos commandes et planifier vos réservations.'
        }
      ]);
    } finally {
      setLiveChatLoading(false);
    }
  };

  // ============================================================================
  // ACT 7: SPECIALIZED AGENTS CAROUSEL STATE
  // ============================================================================
  const [carouselIndex, setCarouselIndex] = useState(0);

  const specializedAgents = [
    {
      role: isEn ? 'Sales & Order Taking Agent' : 'Agent Commercial & Commandes',
      sector: isEn ? 'Retail, E-Commerce & Restaurants' : 'Boutiques, Restaurants & Livraison',
      desc: isEn
        ? 'Greets every customer on WhatsApp, presents available items, builds the shopping cart, and sends the order straight to your dashboard.'
        : 'Accueille chaque client sur WhatsApp, présente vos articles disponibles, assemble le panier complet et transmet la commande directement sur votre tableau de bord.',
      capabilities: isEn
        ? ['Autonomous order taking', 'Catalog & Multi-currency pricing', 'WhatsApp cart validation']
        : ['Prise de commande autonome', 'Catalogue & Tarifs multi-devises', 'Validation panier WhatsApp'],
      icon: ShoppingBag
    },
    {
      role: isEn ? 'Receptionist & Booking Agent' : 'Agent Réceptionniste & Agenda',
      sector: isEn ? 'Clinics, Salons, Consulting & Services' : 'Cliniques, Salons, Cabinets & Services',
      desc: isEn
        ? 'Checks your available time slots, records appointment or table requests, and confirms the booking to the customer immediately.'
        : 'Vérifie vos disponibilités horaires, enregistre les demandes de rendez-vous ou de tables et confirme instantanément le créneau au client.',
      capabilities: isEn
        ? ['24/7 Automated scheduling', 'Zero missed calls', 'Live calendar sync']
        : ['Planification 24h/24', 'Zéro appel manqué', 'Synchronisation agenda'],
      icon: Calendar
    },
    {
      role: isEn ? 'Support & Knowledge Base Agent' : 'Agent Support & Base Documentaire',
      sector: isEn ? 'Enterprises, Schools & Organizations' : 'Entreprises, Écoles & Administrations',
      desc: isEn
        ? 'Relies strictly on your internal documents, brochures, and FAQs to deliver accurate, instant answers in French, English, and local languages.'
        : 'S\'appuie exclusivement sur vos documents internes, brochures et FAQ pour fournir des réponses précises et immédiates à chaque interlocuteur.',
      capabilities: isEn
        ? ['Private knowledge vault', 'Custom instructions', 'Multilingual (FR / EN / Local)']
        : ['Coffre de connaissances privé', 'Réponses sur-mesure', 'Multilingue International'],
      icon: FileText
    },
    {
      role: isEn ? 'Billing & Checkout Agent' : 'Agent Facturation & Encaissement',
      sector: isEn ? 'Digital Commerce & Global Services' : 'Commerce Digital & Prestations',
      desc: isEn
        ? 'Generates certified payment links allowing your customers to pay via Visa, Mastercard, Wave, or Orange Money directly from WhatsApp.'
        : 'Génère des liens de règlement certifiés pour permettre à vos clients de payer par Carte Bancaire (Visa/Mastercard), Wave ou Orange Money depuis WhatsApp.',
      capabilities: isEn
        ? ['Visa, Mastercard & Mobile Money', 'Certified Gateway', 'Real-time payment tracking']
        : ['Visa, Mastercard, Wave & OM', 'Passerelle Certifiée', 'Suivi des transactions'],
      icon: CreditCard
    }
  ];

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev === 0 ? specializedAgents.length - 1 : prev - 1));
  };

  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev === specializedAgents.length - 1 ? 0 : prev + 1));
  };

  // ============================================================================
  // ACT 8: FAQ & DIRECT QUESTION FORM STATE
  // ============================================================================
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [questionInput, setQuestionInput] = useState('');
  const [questionAnswer, setQuestionAnswer] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);

  const faqItems = isEn
    ? [
        {
          question: 'How do I connect my WhatsApp number to my AI agent?',
          answer:
            'From your Enterprise Dashboard, open the WhatsApp QR tab and scan the QR code using the WhatsApp app on your phone (Linked Devices). Works with numbers from any country (+1, +33, +44, +221, +225, etc.).'
        },
        {
          question: 'How does my agent learn my company information?',
          answer:
            'You have a dedicated Knowledge Vault in your dashboard where you can write instructions, add your pricing, opening hours, product catalog, and FAQs.'
        },
        {
          question: 'Which currencies and payment methods are supported?',
          answer:
            'You can display prices in EUR (€), USD ($), or FCFA (XOF), and accept payments via Visa, Mastercard, Wave, Orange Money, and Free Money.'
        },
        {
          question: 'Can I edit instructions or create multiple AI agents anytime?',
          answer:
            'Yes. You can update your agent instructions in real time, pause or resume automated replies at any moment, or create and delete agents as your business evolves.'
        }
      ]
    : [
        {
          question: 'Comment connecter mon numéro WhatsApp à mon agent IA ?',
          answer:
            'Depuis votre Tableau de Bord Entreprise, ouvrez l\'onglet WhatsApp QR et scannez simplement le QR Code affiché avec l\'application WhatsApp de votre téléphone. Compatible avec tous les indicatifs internationaux (+221, +33, +1, +225, +212...).'
        },
        {
          question: 'Comment mon agent apprend-il les informations de mon entreprise ?',
          answer:
            'Vous disposez d\'un Coffre de Connaissances dédié dans votre espace client où vous pouvez rédiger vos consignes, ajouter vos tarifs, vos horaires, votre catalogue et vos réponses types.'
        },
        {
          question: 'Quelles devises et moyens de paiement sont acceptés ?',
          answer:
            'La plateforme supporte l\'affichage en FCFA (XOF), Euro (€) et Dollar ($), et accepte les paiements par Cartes Bancaires internationales (Visa, Mastercard) ainsi que Wave, Orange Money et Free Money.'
        },
        {
          question: 'Puis-je modifier les instructions ou créer plusieurs agents IA ?',
          answer:
            'Oui. Vous pouvez modifier les instructions de votre agent en temps réel, suspendre ou réactiver ses réponses automatiques à tout moment, ou supprimer et recréer un agent selon vos besoins.'
        }
      ];

  const handleAskDirectQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || questionLoading) return;
    setQuestionLoading(true);
    setQuestionAnswer(null);
    try {
      const res = await api.post('/api/ai/chat', {
        message: questionInput.trim(),
        companyName: 'SMG Flow',
        agentName: 'Support SMG Flow',
        knowledgeBase:
          'SMG Flow allows businesses worldwide to create autonomous WhatsApp AI agents for orders, bookings, knowledge base, and global/mobile payments.'
      });
      setQuestionAnswer(
        res?.reply ||
          (isEn
            ? 'Thank you for your question! You can create your account and configure your first AI agent in just a few clicks.'
            : 'Merci pour votre question ! Vous pouvez créer votre compte et configurer votre premier agent IA en quelques clics.')
      );
      setQuestionInput('');
    } catch {
      setQuestionAnswer(
        isEn
          ? 'Your question has been received. Create your account or contact us at contact@smgflow.pro for personalized assistance.'
          : 'Votre question a bien été prise en compte. Créez votre espace client ou écrivez-nous à contact@smgflow.pro pour un accompagnement personnalisé.'
      );
    } finally {
      setQuestionLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-950 overflow-hidden">
      {/* ==========================================================================
          ACTE 1 : HERO SECTION ASYMÉTRIQUE (MODE MOBILE INTERNATIONAL & DESKTOP)
          ========================================================================== */}
      <section className="relative pt-6 pb-14 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-32 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Colonne Gauche : Titre + Sparkle Burst + Boutons Pilules */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-7 text-left">
            <RevealOnScroll animation="fade-down" delayMs={40}>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0052CC]">
                <Globe className="w-4 h-4" />
                <span>
                  {isEn
                    ? `Global WhatsApp AI Platform · Multi-Currency (${currency})`
                    : `Plateforme IA WhatsApp Internationale · Multi-Devises (${currency})`}
                </span>
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-left" delayMs={80}>
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold text-slate-950 tracking-tight font-display leading-[1.14]">
                {isEn ? (
                  <>
                    <span className="block">Explore Your</span>
                    <span className="inline-flex items-start gap-1.5 sm:gap-2 text-[#0052CC]">
                      <span>Future.</span>
                      <SparkleBurst color="#0052CC" className="w-6 h-6 sm:w-8 sm:h-8 -mt-0.5" />
                    </span>
                    <span className="block mt-1">Automate Your Business.</span>
                  </>
                ) : (
                  <>
                    <span className="block">Explorez Votre</span>
                    <span className="inline-flex items-start gap-1.5 sm:gap-2 text-[#0052CC]">
                      <span>Futur.</span>
                      <SparkleBurst color="#0052CC" className="w-6 h-6 sm:w-8 sm:h-8 -mt-0.5" />
                    </span>
                    <span className="block mt-1">Automatisez Votre Entreprise.</span>
                  </>
                )}
              </h1>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-left" delayMs={160}>
              <p className="text-sm sm:text-lg text-slate-500 leading-relaxed max-w-xl font-normal">
                {isEn
                  ? 'Deploy an autonomous AI agent connected directly to your WhatsApp Business number anywhere in the world to reply to customers, take orders, schedule bookings, and accept Card & Mobile Money payments.'
                  : 'Déployez un agent IA autonome directement relié à votre numéro WhatsApp partout dans le monde pour répondre à vos clients, enregistrer vos commandes, planifier vos réservations et encaisser par Carte Bancaire, Wave & Orange Money.'}
              </p>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delayMs={240}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-1">
                {onDirectDashboard ? (
                  <button
                    onClick={onDirectDashboard}
                    className="w-full sm:w-auto px-7 py-4 rounded-full bg-slate-950 hover:bg-[#0052CC] text-white text-sm font-bold flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-slate-950/15 transition-all"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{isEn ? 'Open My Dashboard' : 'Accéder à mon Tableau de Bord'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onCreateAgent}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-950 hover:bg-[#0052CC] text-white text-sm font-bold flex items-center justify-center gap-2.5 cursor-pointer shadow-xl shadow-slate-950/15 transition-all"
                  >
                    <span>{isEn ? 'Get Started Now' : 'Démarrer Maintenant'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={onExploreAgents}
                  className="w-full sm:w-auto px-7 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:border-[#0052CC] hover:text-[#0052CC]"
                >
                  <span>{isEn ? 'Explore AI Agents' : 'Découvrir les Agents IA'}</span>
                </button>
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delayMs={320}>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0052CC] shrink-0" />
                  <span>{isEn ? 'Global WhatsApp QR (180+ Countries)' : 'WhatsApp QR International (180+ Pays)'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0052CC] shrink-0" />
                  <span>{isEn ? 'Multilingual AI (FR / EN / Local)' : 'IA Multilingue (FR / EN / Local)'}</span>
                </span>
              </div>
            </RevealOnScroll>
          </div>

          {/* Colonne Droite : Cercle Bleu Royal #0052CC + Smartphone + Cartes */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <RevealOnScroll
              animation="scale-pop"
              delayMs={150}
              className="relative flex flex-col items-center justify-center w-full"
            >
              <div className="relative w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full bg-[#0052CC] shadow-2xl shadow-blue-600/30 flex items-center justify-center mx-auto my-4 sm:my-6">
                <div className="pointer-events-none absolute -inset-3 sm:-inset-5 rounded-full border border-dashed border-blue-200 animate-spin-slow" />

                {/* Smartphone qui émerge du cercle */}
                <div className="animate-phone-rise relative z-10 w-[236px] sm:w-[272px] bg-slate-950 rounded-[34px] sm:rounded-[36px] p-2 sm:p-2.5 shadow-2xl border-4 border-slate-800">
                  <div className="w-16 sm:w-20 h-3 bg-slate-950 rounded-b-xl mx-auto mb-1" />

                  <div className="bg-white rounded-[24px] sm:rounded-[26px] overflow-hidden flex flex-col h-[330px] sm:h-[365px]">
                    <div className="bg-[#0052CC] text-white px-3 py-2.5 sm:px-3.5 sm:py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="text-[11px] sm:text-xs font-bold leading-tight">
                            SMG Flow AI
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-blue-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                            <span>{isEn ? 'WhatsApp Connected' : 'WhatsApp Connecté'}</span>
                          </div>
                        </div>
                      </div>
                      <QrCode className="w-4 h-4 text-blue-100 shrink-0" />
                    </div>

                    <div className="flex-1 bg-slate-50 p-2.5 sm:p-3 space-y-2 overflow-y-auto text-left">
                      {heroMessages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${
                            m.sender === 'user' ? 'items-end' : 'items-start'
                          } animate-fade-up`}
                        >
                          <div
                            className={`max-w-[88%] px-2.5 py-2 rounded-2xl text-[10px] sm:text-[11px] leading-snug shadow-2xs ${
                              m.sender === 'user'
                                ? 'bg-[#0052CC] text-white rounded-br-xs'
                                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-xs'
                            }`}
                          >
                            {m.tag && (
                              <span className="block text-[9px] font-bold text-[#0052CC] mb-0.5">
                                {m.tag}
                              </span>
                            )}
                            <span>{m.text}</span>
                          </div>
                        </div>
                      ))}

                      {heroTyping && (
                        <div className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-white border border-slate-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC] typing-dot-1" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC] typing-dot-2" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0052CC] typing-dot-3" />
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-white border-t border-slate-100 space-y-1">
                      <div className="text-[9px] font-bold text-slate-400 px-1 text-left">
                        {isEn ? 'Tap to simulate:' : 'Simuler une action :'}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {heroQuickScenarios.map((sc, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleHeroScenario(sc)}
                            className="px-2 py-1 rounded-full bg-slate-100 hover:bg-[#0052CC] hover:text-white text-slate-700 text-[9px] font-bold transition-colors cursor-pointer"
                          >
                            {sc.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARTES FLOTTANTES SUR TABLETTE / DESKTOP */}
                <div className="hidden sm:flex absolute -left-12 top-4 z-20 bg-white rounded-2xl p-3 shadow-xl border border-slate-100 items-center gap-2.5 animate-float max-w-[205px]">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-900">
                      {isEn ? 'AI Orders' : 'Commandes IA'}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {isEn ? 'WhatsApp Checkout' : 'Validation WhatsApp'}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex absolute -left-10 bottom-6 z-20 bg-white rounded-2xl p-3 shadow-xl border border-slate-100 items-center gap-2.5 animate-float-reverse max-w-[205px]">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-900">
                      {isEn ? 'Smart Calendar' : 'Agenda & RDV'}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {isEn ? 'Real-time slots' : 'Créneaux temps réel'}
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex absolute -right-10 top-1/2 -translate-y-1/2 z-20 bg-white rounded-2xl p-3 shadow-xl border border-slate-100 items-center gap-2.5 animate-float max-w-[215px]">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-900">
                      {isEn ? 'Cards & Mobile' : 'CB, Wave & OM'}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">
                      {isEn ? 'Global & Local Pay' : 'Paiement International'}
                    </div>
                  </div>
                </div>
              </div>

              {/* VERSION MOBILE DES 3 CARTES (Grille 3 colonnes sous le téléphone) */}
              <div className="grid grid-cols-3 gap-2 w-full mt-6 sm:hidden">
                <div className="bg-white rounded-2xl p-2.5 shadow-md border border-slate-100 flex flex-col items-center text-center gap-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-tight">
                    {isEn ? 'Orders' : 'Commandes'}
                  </div>
                  <div className="text-[9px] text-slate-500">WhatsApp</div>
                </div>

                <div className="bg-white rounded-2xl p-2.5 shadow-md border border-slate-100 flex flex-col items-center text-center gap-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-tight">
                    {isEn ? 'Bookings' : 'Agenda RDV'}
                  </div>
                  <div className="text-[9px] text-slate-500">24/7</div>
                </div>

                <div className="bg-white rounded-2xl p-2.5 shadow-md border border-slate-100 flex flex-col items-center text-center gap-1">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-tight">
                    {isEn ? 'Payments' : 'CB & Mobile'}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {isEn ? 'Multi-Currency' : 'Multi-Devises'}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

        </div>
      </section>

      {/* ==========================================================================
          ACTE 2 : BANDEAU PLEINE LARGEUR BLEU ROYAL (#0052CC)
          ========================================================================== */}
      <section className="bg-[#0052CC] text-white py-12 sm:py-20 px-4 sm:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          
          <RevealOnScroll animation="fade-left" className="lg:col-span-5">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display leading-tight flex items-start gap-2">
              <span>
                {isEn ? (
                  <>
                    Ready to Automate <br />
                    Your Business Globally?
                  </>
                ) : (
                  <>
                    Prêt à Automatiser <br />
                    Votre Activité ?
                  </>
                )}
              </span>
              <SparkleBurst color="#FFFFFF" className="w-6 h-6 sm:w-7 sm:h-7 -mt-1" />
            </h2>
          </RevealOnScroll>

          <RevealOnScroll
            animation="scale-pop"
            delayMs={120}
            className="lg:col-span-2 flex justify-start lg:justify-center"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-xs">
              <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
          </RevealOnScroll>

          <RevealOnScroll animation="fade-right" delayMs={200} className="lg:col-span-5">
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed font-normal">
              {isEn
                ? 'Connect your professional WhatsApp number in seconds from any country and let your AI agent welcome customers, showcase your catalog, record orders, and confirm bookings 24/7.'
                : 'Connectez votre numéro WhatsApp professionnel en quelques secondes depuis n\'importe quel pays et laissez votre agent IA accueillir vos clients, présenter votre catalogue, enregistrer vos commandes et confirmer vos réservations 24h/24.'}
            </p>
          </RevealOnScroll>

        </div>
      </section>

      {/* ==========================================================================
          ACTE 3 : SECTION "POURQUOI SMG FLOW ?" (GRILLE 4 COLONNES EN CASCADE)
          ========================================================================== */}
      <section className="py-16 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
        <RevealOnScroll animation="fade-up" className="text-center max-w-2xl mx-auto space-y-3 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-display">
            {isEn ? 'Why Choose SMG Flow?' : 'Pourquoi SMG Flow ?'}
          </h2>
          <p className="text-sm sm:text-base text-slate-500">
            {isEn
              ? 'A complete international architecture designed to support your business at every customer interaction.'
              : 'Une architecture internationale complète pensée pour accompagner votre entreprise à chaque interaction client.'}
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
          {(isEn
            ? [
                {
                  icon: Compass,
                  title: 'Guided Setup',
                  desc: 'Define the role, tone, and language of your AI agent step by step with our intuitive builder.'
                },
                {
                  icon: QrCode,
                  title: 'Global WhatsApp QR',
                  desc: 'Link your WhatsApp Business account from any country (+1, +33, +221, +44...) via a secure QR scan.'
                },
                {
                  icon: CreditCard,
                  title: 'Global & Mobile Payments',
                  desc: 'Accept Visa, Mastercard, Wave, Orange Money, and Free Money seamlessly across currencies.'
                },
                {
                  icon: Database,
                  title: 'Private Knowledge Vault',
                  desc: 'Upload your pricing, menus, catalogs, and internal procedures for 100% accurate AI responses.'
                }
              ]
            : [
                {
                  icon: Compass,
                  title: 'Configuration Guidée',
                  desc: 'Définissez le rôle, le ton et les langues de votre agent IA étape par étape grâce à notre assistant intuitif.'
                },
                {
                  icon: QrCode,
                  title: 'WhatsApp International',
                  desc: 'Reliez votre compte WhatsApp de n\'importe quel pays (+221, +33, +1, +225...) par simple scan QR Code.'
                },
                {
                  icon: CreditCard,
                  title: 'Paiements CB & Mobile',
                  desc: 'Encaissez par Cartes Visa/Mastercard internationales, Wave, Orange Money et Free Money.'
                },
                {
                  icon: Database,
                  title: 'Coffre de Connaissances',
                  desc: 'Importez vos tarifs, menus, catalogues et procédures internes pour que l\'IA réponde avec exactitude.'
                }
              ]
          ).map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <RevealOnScroll
                key={index}
                animation="fade-up"
                delayMs={index * 110}
                className="group p-6 sm:p-7 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] group-hover:bg-[#0052CC] text-[#0052CC] group-hover:text-white flex items-center justify-center transition-colors duration-300">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-950 font-display">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0052CC]">
                  <span>{isEn ? 'Included in platform' : 'Inclus dans la plateforme'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* ==========================================================================
          ACTE 4 : SECTION "TROUVEZ L'AGENT IA QUI VOUS CORRESPOND"
          ========================================================================== */}
      <section className="py-16 sm:py-28 px-4 sm:px-8 bg-[#F8FAFC] border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Gauche : Carte du Monde en Pointillés SVG + 3 Cartes Secteurs */}
          <RevealOnScroll
            animation="scale-pop"
            className="lg:col-span-6 relative sm:min-h-[400px] flex flex-col sm:flex-row items-center justify-center"
          >
            <svg
              viewBox="0 0 600 360"
              className="w-full h-auto max-w-[540px] opacity-65"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <pattern
                id="camplyWorldDots"
                x="0"
                y="0"
                width="14"
                height="14"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="3" cy="3" r="2" className="fill-slate-300" />
              </pattern>
              <ellipse cx="150" cy="140" rx="95" ry="65" fill="url(#camplyWorldDots)" />
              <ellipse cx="210" cy="250" rx="55" ry="70" fill="url(#camplyWorldDots)" />
              <ellipse cx="330" cy="120" rx="80" ry="55" fill="url(#camplyWorldDots)" />
              <ellipse cx="340" cy="220" rx="68" ry="75" fill="url(#camplyWorldDots)" />
              <ellipse cx="470" cy="145" rx="95" ry="68" fill="url(#camplyWorldDots)" />
              <ellipse cx="510" cy="265" rx="48" ry="35" fill="url(#camplyWorldDots)" />

              <path
                d="M165 135 Q 260 65 340 190"
                stroke="#0052CC"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="animate-dash-flow"
              />
              <path
                d="M340 190 Q 415 120 475 155"
                stroke="#0052CC"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="animate-dash-flow"
              />
            </svg>

            <div className="grid grid-cols-1 sm:block gap-2.5 w-full mt-2 sm:mt-0">
              <div
                onClick={() => setSelectedSectorKey('resto')}
                className={`sm:absolute sm:top-6 sm:left-6 bg-white rounded-2xl p-3.5 sm:p-4 shadow-md sm:shadow-xl border transition-all cursor-pointer sm:animate-float sm:max-w-[215px] ${
                  selectedSectorKey === 'resto'
                    ? 'border-[#0052CC] ring-2 ring-[#0052CC]/20'
                    : 'border-slate-100 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-900">
                      {isEn ? 'Restaurants' : 'Restauration'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {sectorRecommendations.resto.shortSub}
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSelectedSectorKey('ecom')}
                className={`sm:absolute sm:bottom-8 sm:left-12 bg-white rounded-2xl p-3.5 sm:p-4 shadow-md sm:shadow-xl border transition-all cursor-pointer sm:animate-float-reverse sm:max-w-[220px] ${
                  selectedSectorKey === 'ecom'
                    ? 'border-[#0052CC] ring-2 ring-[#0052CC]/20'
                    : 'border-slate-100 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-900">E-Commerce</div>
                    <div className="text-[10px] text-slate-500">
                      {sectorRecommendations.ecom.shortSub}
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSelectedSectorKey('med')}
                className={`sm:absolute sm:top-1/2 sm:-translate-y-1/2 sm:right-6 bg-white rounded-2xl p-3.5 sm:p-4 shadow-md sm:shadow-xl border transition-all cursor-pointer sm:animate-float sm:max-w-[220px] ${
                  selectedSectorKey === 'med'
                    ? 'border-[#0052CC] ring-2 ring-[#0052CC]/20'
                    : 'border-slate-100 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-slate-900">
                      {isEn ? 'Clinics & Bookings' : 'Cliniques & RDV'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {sectorRecommendations.med.shortSub}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* Droite : Titre + Sélecteur Pilule Flottant Camply + Résultat Dynamique */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-left">
            <RevealOnScroll animation="fade-right">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-display leading-tight">
                {isEn ? (
                  <>
                    <span>Find the </span>
                    <span className="inline-flex items-start gap-1.5 text-[#0052CC]">
                      <span>Ideal AI Agent</span>
                      <SparkleBurst color="#0052CC" className="w-6 h-6 -mt-1" />
                    </span>
                    <span className="block">For Your Industry.</span>
                  </>
                ) : (
                  <>
                    <span>Trouvez l'Agent IA </span>
                    <span className="inline-flex items-start gap-1.5 text-[#0052CC]">
                      <span>Idéal</span>
                      <SparkleBurst color="#0052CC" className="w-6 h-6 -mt-1" />
                    </span>
                    <span className="block">Pour Votre Secteur.</span>
                  </>
                )}
              </h2>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-right" delayMs={100}>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                {isEn
                  ? 'Select your industry and primary mission to preview the recommended WhatsApp AI agent architecture for your business.'
                  : 'Sélectionnez votre domaine d\'activité et la mission principale que vous souhaitez confier à votre assistant WhatsApp pour afficher la configuration recommandée.'}
              </p>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delayMs={180}>
              <div className="bg-white rounded-3xl sm:rounded-full p-3.5 sm:p-2.5 sm:pl-6 shadow-xl shadow-slate-900/5 border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                
                <div className="flex-1 text-left">
                  <label className="block text-[10px] font-bold text-slate-400">
                    {isEn ? 'Industry' : "Secteur d'activité"}
                  </label>
                  <select
                    value={selectedSectorKey}
                    onChange={(e) => {
                      setSelectedSectorKey(e.target.value as 'resto' | 'ecom' | 'med' | 'b2b');
                      setFinderConfirmed(true);
                    }}
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer py-1 sm:py-0.5"
                  >
                    <option value="resto">{sectorRecommendations.resto.label}</option>
                    <option value="ecom">{sectorRecommendations.ecom.label}</option>
                    <option value="med">{sectorRecommendations.med.label}</option>
                    <option value="b2b">{sectorRecommendations.b2b.label}</option>
                  </select>
                </div>

                <div className="h-px sm:h-8 w-full sm:w-px bg-slate-100 sm:bg-slate-200" />

                <div className="flex-1 text-left">
                  <label className="block text-[10px] font-bold text-slate-400">
                    {isEn ? 'Primary Mission' : 'Mission principale'}
                  </label>
                  <select
                    value={selectedMissionIndex}
                    onChange={(e) => {
                      setSelectedMissionIndex(Number(e.target.value));
                      setFinderConfirmed(true);
                    }}
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer py-1 sm:py-0.5"
                  >
                    {missionsList.map((m, idx) => (
                      <option key={idx} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setFinderConfirmed(true)}
                  title={isEn ? 'Show recommended agent' : "Afficher l'agent recommandé"}
                  className="w-full sm:w-12 h-11 sm:h-12 rounded-full bg-slate-950 hover:bg-[#0052CC] text-white flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors shadow-md"
                >
                  <Search className="w-4 h-4" />
                  <span className="sm:hidden text-xs font-bold">
                    {isEn ? 'Show AI Agent' : "Afficher l'Agent IA"}
                  </span>
                </button>
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delayMs={260}>
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-blue-100 shadow-md space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#0052CC]">
                      {isEn ? 'Recommended Architecture' : 'Architecture Recommandée'} ·{' '}
                      {missionsList[selectedMissionIndex]}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-950 mt-0.5 font-display">
                      {activeRecommendation.title}
                    </h3>
                  </div>
                  {finderConfirmed && (
                    <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
                      {isEn ? 'Ready' : 'Prêt'}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeRecommendation.desc}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                    {activeRecommendation.modules.map((mod, idx) => (
                      <React.Fragment key={mod}>
                        {idx > 0 && <span aria-hidden="true">·</span>}
                        <span>{mod}</span>
                      </React.Fragment>
                    ))}
                  </div>

                  <button
                    onClick={onCreateAgent}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#0052CC] hover:bg-[#0041A3] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>{isEn ? 'Create This Agent' : 'Créer cet Agent'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </RevealOnScroll>

          </div>

        </div>
      </section>

      {/* ==========================================================================
          ACTE 5 : SECTION ÉCOSYSTÈME RADIAL "UN RÉSEAU COMPLET D'AUTOMATISATION"
          ========================================================================== */}
      <section className="py-16 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-left">
            <RevealOnScroll animation="fade-left">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-display leading-tight">
                {isEn ? (
                  <>
                    <span>A Complete </span>
                    <span className="inline-flex items-start gap-1.5 text-[#0052CC]">
                      <span>Automation Network.</span>
                      <SparkleBurst color="#0052CC" className="w-6 h-6 -mt-1" />
                    </span>
                  </>
                ) : (
                  <>
                    <span>Un Réseau Complet </span>
                    <span className="inline-flex items-start gap-1.5 text-[#0052CC]">
                      <span>d'Automatisation.</span>
                      <SparkleBurst color="#0052CC" className="w-6 h-6 -mt-1" />
                    </span>
                  </>
                )}
              </h2>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-left" delayMs={100}>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                {isEn
                  ? 'At the center of your operations, the SMG Flow AI engine synchronizes your WhatsApp messaging, catalog, calendar, and multi-currency payments in real time.'
                  : 'Au centre de votre activité, le moteur IA SMG Flow synchronise en temps réel votre messagerie WhatsApp, votre catalogue, votre agenda et vos encaissements multi-devises.'}
              </p>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delayMs={160}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {orbitNodes.map((node, i) => {
                  const IconComp = node.icon;
                  const isSelected = activeOrbitIndex === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveOrbitIndex(i)}
                      className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-md shadow-blue-600/20'
                          : 'bg-white text-slate-700 border-slate-200/80 hover:border-[#0052CC]/50 hover:bg-slate-50'
                      }`}
                    >
                      <IconComp
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-white' : 'text-[#0052CC]'
                        }`}
                      />
                      <span className="text-xs font-bold truncate">
                        {node.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delayMs={220}>
              <div className="p-5 sm:p-6 rounded-3xl bg-[#F8FAFC] border border-slate-200/90 space-y-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-[#0052CC]">
                    {isEn ? 'Selected Ecosystem Module' : "Module sélectionné dans l'écosystème"}
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-slate-950 font-display">
                    {orbitNodes[activeOrbitIndex].title}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {orbitNodes[activeOrbitIndex].desc}
                  </p>
                </div>

                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70">
                  <button
                    onClick={onNavigateHowItWorks}
                    className="w-full sm:w-auto justify-center px-6 py-3 rounded-full bg-slate-950 hover:bg-[#0052CC] text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <span>{isEn ? 'See How It Works' : 'Voir le Fonctionnement'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-400 mx-auto sm:mx-0">
                    {isEn
                      ? `Module ${activeOrbitIndex + 1} of ${orbitNodes.length}`
                      : `Module ${activeOrbitIndex + 1} sur ${orbitNodes.length}`}
                  </span>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          <RevealOnScroll
            animation="scale-pop"
            delayMs={150}
            className="lg:col-span-6 flex items-center justify-center"
          >
            <div className="relative w-full max-w-[300px] sm:max-w-[420px] aspect-square mx-auto flex items-center justify-center">
              <div className="pointer-events-none absolute inset-[14%] rounded-full border-2 border-dashed border-blue-200 animate-spin-slow" />
              <div className="pointer-events-none absolute inset-[28%] rounded-full border border-dashed border-slate-300 animate-spin-reverse-slow" />

              <svg
                viewBox="0 0 400 400"
                className="pointer-events-none absolute inset-0 w-full h-full"
              >
                {orbitNodes.map((node, i) => {
                  const rad = (node.angleDeg * Math.PI) / 180;
                  const x2 = 200 + Math.cos(rad) * 140;
                  const y2 = 200 + Math.sin(rad) * 140;
                  return (
                    <line
                      key={i}
                      x1="200"
                      y1="200"
                      x2={x2}
                      y2={y2}
                      stroke={activeOrbitIndex === i ? '#0052CC' : '#CBD5E1'}
                      strokeWidth={activeOrbitIndex === i ? '2.5' : '1.5'}
                      strokeDasharray="5 5"
                    />
                  );
                })}
              </svg>

              <div className="relative z-10 w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-[#0052CC] text-white shadow-2xl shadow-blue-600/35 flex flex-col items-center justify-center text-center p-2 border-4 border-white">
                <Bot className="w-5 h-5 sm:w-8 sm:h-8 mb-0.5" />
                <span className="text-[10px] sm:text-sm font-extrabold font-display leading-tight">
                  {isEn ? 'AI Core' : 'Cœur IA'}
                </span>
                <span className="text-[8px] sm:text-[10px] text-blue-100">SMG Flow</span>
              </div>

              {orbitNodes.map((node, i) => {
                const IconComp = node.icon;
                const rad = (node.angleDeg * Math.PI) / 180;
                const leftPct = 50 + Math.cos(rad) * 35;
                const topPct = 50 + Math.sin(rad) * 35;
                const isSelected = activeOrbitIndex === i;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveOrbitIndex(i)}
                    onMouseEnter={() => setActiveOrbitIndex(i)}
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    className={`-translate-x-1/2 -translate-y-1/2 absolute z-20 w-[72px] sm:w-auto px-1.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${
                      isSelected
                        ? 'bg-[#0052CC] text-white border-[#0052CC] scale-105 shadow-blue-600/25'
                        : 'bg-white text-slate-800 border-slate-200/90 hover:border-blue-300'
                    }`}
                  >
                    <IconComp
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                        isSelected ? 'text-white' : 'text-[#0052CC]'
                      }`}
                    />
                    <span className="text-[9px] sm:text-xs font-bold leading-tight text-center whitespace-nowrap">
                      {node.shortLabel}
                    </span>
                  </button>
                );
              })}

            </div>
          </RevealOnScroll>

        </div>
      </section>

      {/* ==========================================================================
          ACTE 6 : SECTION "DÉCOUVREZ VOTRE FUTUR ASSISTANT VIRTUEL"
          ========================================================================== */}
      <section className="py-16 sm:py-28 px-4 sm:px-8 bg-[#F8FAFC] border-y border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
          
          <RevealOnScroll animation="fade-up" className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-display">
              {isEn ? (
                <>
                  <span>Meet Your Future </span>
                  <span className="inline-flex items-start gap-1.5 text-[#0052CC]">
                    <span>Virtual Assistant</span>
                    <SparkleBurst color="#0052CC" className="w-6 h-6 -mt-1" />
                  </span>
                </>
              ) : (
                <>
                  <span>Découvrez Votre Futur </span>
                  <span className="inline-flex items-start gap-1.5 text-[#0052CC]">
                    <span>Assistant Virtuel</span>
                    <SparkleBurst color="#0052CC" className="w-6 h-6 -mt-1" />
                  </span>
                </>
              )}
            </h2>
            <p className="text-sm sm:text-base text-slate-500">
              {isEn
                ? 'Test a live conversation in the center phone and see how every customer request triggers an automated action.'
                : 'Testez une conversation en direct au centre et observez comment chaque demande client déclenche une action précise.'}
            </p>
          </RevealOnScroll>

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            
            <svg
              viewBox="0 0 1200 500"
              fill="none"
              className="hidden lg:block pointer-events-none absolute inset-0 w-full h-full z-0"
            >
              <path
                d="M330 130 Q 430 110 470 180"
                stroke="#0052CC"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="animate-dash-flow"
              />
              <path
                d="M330 370 Q 430 390 470 320"
                stroke="#0052CC"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="animate-dash-flow"
              />
              <path
                d="M870 130 Q 770 110 730 180"
                stroke="#0052CC"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="animate-dash-flow"
              />
              <path
                d="M870 370 Q 770 390 730 320"
                stroke="#0052CC"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="animate-dash-flow"
              />
            </svg>

            {/* Colonne Centrale : Grand Smartphone Interactif (order-1 sur mobile) */}
            <RevealOnScroll
              animation="fade-up"
              delayMs={100}
              className="order-1 lg:order-2 lg:col-span-4 flex justify-center relative z-10"
            >
              <div
                ref={livePhoneRef}
                className="w-full max-w-[300px] sm:max-w-[320px] bg-slate-950 rounded-[40px] p-2.5 sm:p-3 shadow-2xl border-4 border-slate-800"
              >
                <div className="w-20 sm:w-24 h-3.5 bg-slate-950 rounded-b-xl mx-auto mb-1.5" />

                <div className="bg-white rounded-[30px] overflow-hidden flex flex-col h-[420px] sm:h-[460px]">
                  <div className="bg-[#0052CC] text-white p-3.5 sm:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-extrabold">
                          {isEn ? 'SMG Flow Assistant' : 'Assistant SMG Flow'}
                        </div>
                        <div className="text-[10px] text-blue-100">
                          {isEn ? 'Live Simulator' : 'Simulateur Temps Réel'}
                        </div>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
                  </div>

                  <div className="flex-1 bg-slate-50 p-3 sm:p-3.5 space-y-2.5 overflow-y-auto text-left">
                    {liveChatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col ${
                          msg.sender === 'user' ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-[#0052CC] text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-2xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {liveChatLoading && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-slate-200/80 text-xs text-slate-500">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0052CC]" />
                        <span>{isEn ? 'Replying...' : 'Réponse en cours...'}</span>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => handleSendLiveChat(e)}
                    className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={liveChatInput}
                      onChange={(e) => setLiveChatInput(e.target.value)}
                      placeholder={
                        isEn ? 'Write a message to the AI...' : "Écrivez un message à l'IA..."
                      }
                      className="flex-1 min-w-0 bg-slate-100 rounded-full px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/30"
                    />
                    <button
                      type="submit"
                      disabled={liveChatLoading}
                      className="w-8 h-8 rounded-full bg-[#0052CC] hover:bg-[#0041A3] text-white flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </RevealOnScroll>

            {/* Colonne Gauche : 2 Cartes Satellites */}
            <div className="order-2 lg:order-1 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 relative z-10">
              <RevealOnScroll animation="fade-left" delayMs={100}>
                <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-md border border-slate-100 text-left space-y-2.5 hover:-translate-y-1 transition-transform">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#EFF6FF] text-[#0052CC] flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950 font-display">
                    {isEn ? 'Catalog & Pricing' : 'Catalogue & Tarifs'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {isEn
                      ? 'Instantly presents your products, menus, or service plans with crystal clarity.'
                      : 'Présente instantanément vos produits, menus ou formules tarifaires avec une clarté irréprochable.'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendLiveChat(
                        undefined,
                        isEn
                          ? 'What are your services and pricing plans?'
                          : 'Quels sont vos services et tarifs ?'
                      )
                    }
                    className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>{isEn ? 'Test in phone' : 'Tester dans le téléphone'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </RevealOnScroll>

              <RevealOnScroll animation="fade-left" delayMs={200}>
                <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-md border border-slate-100 text-left space-y-2.5 hover:-translate-y-1 transition-transform">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#EFF6FF] text-[#0052CC] flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950 font-display">
                    {isEn ? 'Order Taking & Checkout' : 'Prise de Commandes & Paiement'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {isEn
                      ? 'Builds the customer cart and offers instant payment via Card, Wave, or Orange Money.'
                      : 'Assemble le panier du client et propose le règlement direct par Carte, Wave ou Orange Money.'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendLiveChat(
                        undefined,
                        isEn
                          ? 'I would like to place an order and get a payment link.'
                          : 'Je souhaite passer une commande et recevoir un lien de paiement.'
                      )
                    }
                    className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>{isEn ? 'Test in phone' : 'Tester dans le téléphone'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </RevealOnScroll>
            </div>

            {/* Colonne Droite : 2 Cartes Satellites */}
            <div className="order-3 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6 relative z-10">
              <RevealOnScroll animation="fade-right" delayMs={150}>
                <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-md border border-slate-100 text-left space-y-2.5 hover:-translate-y-1 transition-transform">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#EFF6FF] text-[#0052CC] flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950 font-display">
                    {isEn ? 'Calendar & Bookings' : "Gestion d'Agenda & RDV"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {isEn
                      ? 'Checks your available slots and records every appointment directly in your workspace.'
                      : 'Vérifie vos créneaux disponibles et enregistre chaque réservation directement dans votre espace.'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendLiveChat(
                        undefined,
                        isEn
                          ? 'I would like to book an appointment for tomorrow.'
                          : 'Je voudrais réserver un créneau pour demain.'
                      )
                    }
                    className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>{isEn ? 'Test in phone' : 'Tester dans le téléphone'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </RevealOnScroll>

              <RevealOnScroll animation="fade-right" delayMs={250}>
                <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-md border border-slate-100 text-left space-y-2.5 hover:-translate-y-1 transition-transform">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#EFF6FF] text-[#0052CC] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950 font-display">
                    {isEn ? '24/7 Multilingual Support' : 'Support Client 24h/24'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {isEn
                      ? 'Replies without delay to technical or practical inquiries based on your knowledge base.'
                      : 'Répond sans attente aux questions techniques ou pratiques à partir de votre base documentaire.'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleSendLiveChat(
                        undefined,
                        isEn
                          ? 'How do I connect my WhatsApp number via QR Code?'
                          : 'Comment connecter mon numéro WhatsApp par QR Code ?'
                      )
                    }
                    className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>{isEn ? 'Test in phone' : 'Tester dans le téléphone'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </RevealOnScroll>
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================================================
          ACTE 7 : CARROUSEL HORIZONTAL "DES AGENTS SPÉCIALISÉS POUR CHAQUE MISSION."
          ========================================================================== */}
      <section className="py-16 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
          
          <RevealOnScroll animation="fade-left" className="lg:col-span-4 space-y-5 text-left">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-display leading-tight">
              {isEn ? (
                <>
                  <span>Specialized AI Agents For </span>
                  <span className="inline-flex items-start gap-1.5 text-[#0052CC]">
                    <span>Every Mission.</span>
                    <SparkleBurst color="#0052CC" className="w-6 h-6 -mt-1" />
                  </span>
                </>
              ) : (
                <>
                  <span>Des Agents Spécialisés Pour </span>
                  <span className="inline-flex items-start gap-1.5 text-[#0052CC]">
                    <span>Chaque Mission.</span>
                    <SparkleBurst color="#0052CC" className="w-6 h-6 -mt-1" />
                  </span>
                </>
              )}
            </h2>

            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              {isEn
                ? 'Choose a pre-structured agent template or build your own custom agent from your dashboard.'
                : "Choisissez un modèle d'agent pré-structuré ou créez votre propre agent sur-mesure depuis votre tableau de bord."}
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handlePrevCarousel}
                aria-label="Previous agent"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-slate-200 hover:border-[#0052CC] bg-white hover:bg-[#0052CC] text-slate-800 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextCarousel}
                aria-label="Next agent"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-950 hover:bg-[#0052CC] text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </RevealOnScroll>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {[
                specializedAgents[carouselIndex % specializedAgents.length],
                specializedAgents[(carouselIndex + 1) % specializedAgents.length]
              ].map((agent, idx) => {
                const AgentIcon = agent.icon;
                return (
                  <RevealOnScroll
                    key={`${agent.role}-${idx}`}
                    animation="fade-right"
                    delayMs={idx * 120}
                    className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 hover:border-[#0052CC] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between text-left"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#EFF6FF] text-[#0052CC] flex items-center justify-center shrink-0">
                          <AgentIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-xs font-semibold text-slate-400 text-right">
                          {agent.sector}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 font-display">
                        {agent.role}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        {agent.desc}
                      </p>

                      <div className="pt-2 space-y-2">
                        {agent.capabilities.map((cap) => (
                          <div
                            key={cap}
                            className="flex items-center gap-2 text-xs font-semibold text-slate-700"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#0052CC] shrink-0" />
                            <span>{cap}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={onCreateAgent}
                        className="text-xs font-bold text-[#0052CC] hover:text-slate-950 flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>
                          {isEn ? 'Deploy this agent profile' : "Déployer ce profil d'agent"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================================================
          ACTE 8 : SECTION "UNE QUESTION SUR SMG FLOW ?"
          ========================================================================== */}
      <section className="py-16 sm:py-28 px-4 sm:px-8 bg-[#F8FAFC] border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          <RevealOnScroll animation="fade-left" className="lg:col-span-5 space-y-5 sm:space-y-6 text-left">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-display leading-tight">
              {isEn ? (
                <>
                  Have a Question About <br />
                  <span className="text-[#0052CC]">SMG Flow?</span>
                </>
              ) : (
                <>
                  Une Question sur <br />
                  <span className="text-[#0052CC]">SMG Flow ?</span>
                </>
              )}
            </h2>

            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              {isEn
                ? 'Ask your question directly below or browse the detailed answers about how our platform and multi-currency plans work.'
                : 'Posez directement votre question ci-dessous ou consultez les réponses détaillées sur le fonctionnement de notre plateforme et de nos forfaits.'}
            </p>

            <form
              onSubmit={handleAskDirectQuestion}
              className="bg-white rounded-full p-1.5 pl-4 sm:pl-5 border border-slate-200 shadow-md flex items-center justify-between gap-2"
            >
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder={
                  isEn ? 'Ask your question here...' : 'Posez votre question ici...'
                }
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={questionLoading}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-slate-950 hover:bg-[#0052CC] text-white text-xs sm:text-sm font-bold cursor-pointer transition-colors shrink-0 disabled:opacity-50"
              >
                {questionLoading
                  ? isEn
                    ? 'Sending...'
                    : 'Envoi...'
                  : isEn
                  ? 'Send'
                  : 'Envoyer'}
              </button>
            </form>

            {questionAnswer && (
              <div className="p-4 rounded-2xl bg-white border border-blue-200 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-xs animate-fade-up">
                <div className="font-bold text-[#0052CC] mb-1">
                  {isEn ? 'SMG Flow Answer:' : 'Réponse SMG Flow :'}
                </div>
                {questionAnswer}
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={onNavigatePricing}
                className="text-xs font-bold text-[#0052CC] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <span>
                  {isEn
                    ? `View full pricing plans (${currency})`
                    : `Consulter la grille tarifaire complète (${currency})`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </RevealOnScroll>

          <div className="lg:col-span-7 divide-y divide-slate-200 border-t border-b border-slate-200">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <RevealOnScroll key={idx} animation="fade-right" delayMs={idx * 90}>
                  <div className="py-4 sm:py-5">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-3 sm:gap-4 text-left cursor-pointer group"
                    >
                      <span className="text-sm sm:text-lg font-bold text-slate-900 group-hover:text-[#0052CC] transition-colors font-display leading-snug">
                        {item.question}
                      </span>
                      <span
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isOpen
                            ? 'bg-[#0052CC] text-white rotate-90'
                            : 'bg-white border border-slate-200 text-slate-700 group-hover:border-[#0052CC] group-hover:text-[#0052CC]'
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </button>

                    {isOpen && (
                      <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed pr-4 sm:pr-10 animate-fade-up">
                        {item.answer}
                      </p>
                    )}
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
};
