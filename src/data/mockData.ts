import { CompanyProfile, PlatformModule, InstructionRule } from '../types';

export const DEFAULT_COMPANY: CompanyProfile = {
  id: 'c-default',
  name: 'Mon Entreprise',
  agentName: '',
  industry: '',
  phone: '',
  email: '',
  plan: 'pro',
  status: 'active',
  dataSpaceId: 'vault-default',
  monthlyCreditsLimit: 0,
  creditsUsed: 0,
  conversationsCount: 0,
  clientsCount: 0,
  ordersCount: 0,
  appointmentsCount: 0
};

export const MOCK_MODULES: PlatformModule[] = [
  {
    id: 'whatsapp_gateway',
    name: 'Passerelle WhatsApp Baileys Multi-Appareils',
    description: 'Permet à l\'agent de recevoir et répondre automatiquement aux clients sur WhatsApp avec synchronisation instantanée.',
    category: 'Canaux',
    enabled: true,
    iconName: 'Smartphone',
    isPopular: true
  },
  {
    id: 'ai_engine',
    name: 'Moteur IA Hybride Google GenAI & Gemini 3.8 Flash',
    description: 'Inférence ultra-rapide pour des réponses naturelles contextualisées avec vos documents d\'entreprise.',
    category: 'Intelligence',
    enabled: true,
    iconName: 'Bot',
    isPopular: true
  },
  {
    id: 'reservations',
    name: 'Module Réservations & Prise de RDV',
    description: 'Gestion automatique des créneaux horaires, confirmation de table ou rendez-vous client en autonomie.',
    category: 'Opérations',
    enabled: true,
    iconName: 'Utensils',
    isPopular: true
  },
  {
    id: 'orders_catalog',
    name: 'Commandes & Produits en direct',
    description: 'Catalogue de produits, suivi de stock et panier de commande automatisé sans intervention humaine.',
    category: 'Ventes',
    enabled: true,
    iconName: 'ShoppingBag',
    isPopular: true
  },
  {
    id: 'crm_contacts',
    name: 'CRM Clients & Historique d\'achats',
    description: 'Enregistrement automatique des coordonnées des prospects et catégorisation client.',
    category: 'CRM',
    enabled: true,
    iconName: 'Users',
    isPopular: false
  },
  {
    id: 'rag_documents',
    name: 'Base de Connaissances & Documents RAG',
    description: 'Assimilation de documents, grilles tarifaires et données internes pour guider les réponses de l\'agent.',
    category: 'Connaissances',
    enabled: true,
    iconName: 'Database',
    isPopular: true
  }
];

export const MOCK_INSTRUCTIONS: InstructionRule[] = [];
