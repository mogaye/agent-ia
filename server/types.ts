export type UserRole = 'super_admin' | 'company_admin' | 'company_user';

export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  createdAt: string;
  isVipFree?: boolean;
}

export interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  issuedAt: number;
  expiresAt: number;
  isVipFree?: boolean;
}

export interface CompanyEntity {
  id: string;
  name: string;
  agentName: string;
  industry: string;
  phone?: string;
  email?: string;
  plan: 'starter' | 'pro' | 'business' | 'enterprise_125k';
  planPriceXOF?: number;
  status: 'active' | 'paused';
  dataSpaceId: string;
  monthlyCreditsLimit: number;
  creditsUsed: number;
  isVipFree?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDefinition {
  id: 'starter' | 'pro' | 'business' | 'enterprise_125k' | 'credits_pack_20k';
  name: string;
  priceXOF: number;
  priceEUR: number;
  credits: number;
  period?: 'month' | 'one_time';
}

export interface TransactionEntity {
  id: string;
  refCommand: string;
  gateway: 'paytech' | 'paydunya' | 'direct';
  planId: string;
  itemName: string;
  amount: number;
  currency: string;
  creditsAdded: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  paymentMethod: string;
  companyId: string;
  companyName: string;
  clientName?: string;
  clientPhone?: string;
  token?: string;
  receiptUrl?: string;
  createdAt: string;
  paidAt?: string;
}

export interface WhatsAppLogEntity {
  id: string;
  companyId: string;
  sender: string;
  messageBody: string;
  aiResponse: string;
  timestamp: string;
}

export interface WhatsAppOptOutEntity {
  id: string;
  companyId: string;
  phoneNumber: string;
  optedOutAt: string;
  reason?: string;
}
