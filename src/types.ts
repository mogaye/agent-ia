export type DashboardTab = 
  | 'overview' 
  | 'agents'
  | 'whatsapp'
  | 'knowledge'
  | 'instructions'
  | 'conversations'
  | 'operations'
  | 'billing'
  | 'company_profile'
  | 'agent' 
  | 'clients' 
  | 'orders' 
  | 'reservations' 
  | 'calendar' 
  | 'products' 
  | 'invoices' 
  | 'documents' 
  | 'modules' 
  | 'settings';

export type AgentRoleType = 
  | 'customer_service'    // Service client & SAV uniquement
  | 'sales_orders'        // Prise de commandes & Ventes
  | 'reservations'        // Réservations de tables / RDV
  | 'tech_support'        // Support technique
  | 'general';            // Polyvalent

export interface EnterpriseAgent {
  id: string;
  name: string;
  roleType: AgentRoleType;
  roleTitle: string;
  description: string;
  avatar?: string;
  welcomeMessage: string;
  channels: ('whatsapp' | 'web' | 'email')[];
  whatsappNumber?: string;
  whatsappStatus?: 'connected' | 'disconnected' | 'connecting';
  status: 'active' | 'paused';
  knowledgeText?: string;
  documents?: DocumentItem[];
  promptInstruction?: string;
  strictRules?: string[];
  conversationsCount?: number;
  createdAt?: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  agentName: string;
  industry: string;
  phone?: string;
  email?: string;
  plan?: 'starter' | 'pro' | 'business' | 'enterprise_125k';
  planPriceXOF?: number;
  status: 'active' | 'paused';
  dataSpaceId: string;
  monthlyCreditsLimit?: number;
  creditsUsed?: number;
  conversationsCount?: number;
  clientsCount?: number;
  ordersCount?: number;
  appointmentsCount?: number;
  customInstructions?: string;
  personalContactName?: string;
  personalContactRole?: string;
  personalContactPhone?: string;
  personalContactEmail?: string;
  address?: string;
  openingHours?: string;
  website?: string;
  agents?: EnterpriseAgent[];
  isVipFree?: boolean;
}

export type UserRole = 'super_admin' | 'company_admin' | 'company_user' | 'enterprise';

export interface AuthSession {
  role: UserRole;
  userEmail: string;
  userName: string;
  userPhone?: string;
  companyId?: string;
  companyName?: string;
  isVipFree?: boolean;
}

export interface CustomerCRMItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: 'Lead' | 'Client Confirmé' | 'VIP';
  totalSpent: number;
  lastContact: string;
}

export interface OrderItem {
  id: string;
  customerName: string;
  items: string[];
  totalAmount: number;
  status: 'En attente' | 'Confirmée' | 'Expédiée' | 'Livrée';
  createdAt: string;
}

export interface ReservationItem {
  id: string;
  customerName: string;
  date: string;
  time: string;
  guestsCount: number;
  status: 'Confirmée' | 'En attente' | 'Annulée';
  notes?: string;
}

export interface CalendarSlot {
  id: string;
  title: string;
  type: 'rdv' | 'appel' | 'service' | 'all';
  clientName: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: 'Confirmé' | 'Libre' | 'Annulé';
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  status: 'Disponible' | 'Rupture';
}

export interface InvoiceItem {
  id: string;
  customerName: string;
  amount: number;
  status: 'Payée' | 'En attente' | 'En retard';
  date: string;
  downloadUrl?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  size: string;
  uploadedAt: string;
  url?: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
}

export interface InstructionRule {
  id: string;
  rule: string;
  category: string;
  active: boolean;
  createdAt: string;
  source?: string;
}

export interface PlatformModule {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  iconName: string;
  isPopular?: boolean;
}
