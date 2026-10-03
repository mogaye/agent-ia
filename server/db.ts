import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { 
  AuthUser, 
  CompanyEntity, 
  TransactionEntity, 
  WhatsAppLogEntity, 
  WhatsAppOptOutEntity,
  UserRole 
} from './types.ts';
import { hashPassword } from './auth.ts';

const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
// Strip potential /rest/v1 or trailing slashes
const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

let adminClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch (err) {
    console.warn('[Supabase DB Admin] Initialization notice:', err);
    adminClient = null;
  }
}

export const supabaseAdmin: SupabaseClient | null = adminClient;

// ==========================================
// IN-MEMORY MULTI-TENANT STORE (Fallback / Cache)
// ==========================================

const companiesStore = new Map<string, CompanyEntity>();
const usersStore = new Map<string, AuthUser & { passwordHash?: string }>();
const agentContextStore = new Map<string, any>();
const whatsappLogsStore: WhatsAppLogEntity[] = [];
const optOutsStore: WhatsAppOptOutEntity[] = [];
const transactionsStore = new Map<string, TransactionEntity>();

// Bootstrap initial super admin account (sans fausses données)
function bootstrapInitialData() {
  const vipEmail = (process.env.SUPER_ADMIN_EMAIL || 'mgaye60000@gmail.com').toLowerCase();
  const vipCompanyId = 'c-mgaye60000';
  const rawAdminPass = process.env.SUPER_ADMIN_PASSWORD || 'momo2003';
  const vipPasswordHash = rawAdminPass.includes(':') ? rawAdminPass : hashPassword(rawAdminPass);

  companiesStore.set(vipCompanyId, {
    id: vipCompanyId,
    name: 'Entreprise Mamadou Gaye (Admin & VIP)',
    agentName: '',
    industry: '',
    phone: '',
    email: vipEmail,
    plan: 'enterprise_125k',
    planPriceXOF: 0,
    status: 'active',
    dataSpaceId: `vault-${vipCompanyId}`,
    monthlyCreditsLimit: 0,
    creditsUsed: 0,
    isVipFree: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  usersStore.set(vipEmail, {
    id: 'u-mgaye60000',
    email: vipEmail,
    fullName: 'Mamadou Gaye (Super Admin)',
    role: 'super_admin',
    companyId: vipCompanyId,
    companyName: 'Entreprise Mamadou Gaye (Admin & VIP)',
    createdAt: new Date().toISOString(),
    passwordHash: vipPasswordHash,
    isVipFree: true
  });

  if (vipEmail !== 'admin@smgflow.pro') {
    usersStore.set('admin@smgflow.pro', {
      id: 'u-super-admin',
      email: 'admin@smgflow.pro',
      fullName: 'Administrateur SMG Flow',
      role: 'super_admin',
      companyId: vipCompanyId,
      companyName: 'SMG Flow Platform',
      createdAt: new Date().toISOString(),
      passwordHash: vipPasswordHash
    });
  }
}

bootstrapInitialData();

// ==========================================
// REPOSITORY METHODS
// ==========================================

export const db = {
  // Users
  async findUserByIdentifier(identifier: string): Promise<(AuthUser & { passwordHash?: string }) | null> {
    const cleanId = identifier.trim().toLowerCase();
    
    // Check local store first
    for (const user of usersStore.values()) {
      if (user.email.toLowerCase() === cleanId) return user;
      if (user.phone && user.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, '')) return user;
    }

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .or(`email.eq.${cleanId},phone.eq.${cleanId}`)
          .limit(1)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            email: data.email,
            phone: data.phone,
            fullName: data.full_name,
            role: data.role as UserRole,
            companyId: data.company_id,
            companyName: data.company_name,
            createdAt: data.created_at,
            passwordHash: data.password_hash
          };
        }
      } catch (e) {
        console.warn('[DB] Supabase user fetch error:', e);
      }
    }

    return null;
  },

  async createUser(params: {
    email: string;
    phone?: string;
    fullName: string;
    role: UserRole;
    companyId: string;
    companyName: string;
    passwordHash?: string;
  }): Promise<AuthUser> {
    const id = `u-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newUser: AuthUser & { passwordHash?: string } = {
      id,
      email: params.email.trim().toLowerCase(),
      phone: params.phone?.trim(),
      fullName: params.fullName.trim(),
      role: params.role,
      companyId: params.companyId,
      companyName: params.companyName,
      createdAt: new Date().toISOString(),
      passwordHash: params.passwordHash
    };

    usersStore.set(newUser.email, newUser);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('users').insert({
          id: newUser.id,
          email: newUser.email,
          phone: newUser.phone,
          full_name: newUser.fullName,
          role: newUser.role,
          company_id: newUser.companyId,
          company_name: newUser.companyName,
          password_hash: newUser.passwordHash
        });
      } catch (e) {
        console.warn('[DB] Supabase insert user notice:', e);
      }
    }

    return {
      id: newUser.id,
      email: newUser.email,
      phone: newUser.phone,
      fullName: newUser.fullName,
      role: newUser.role,
      companyId: newUser.companyId,
      companyName: newUser.companyName,
      createdAt: newUser.createdAt
    };
  },

  // Companies
  async findCompanyById(companyId: string): Promise<CompanyEntity | null> {
    const local = companiesStore.get(companyId);
    if (local) return local;

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (!error && data) {
          const comp: CompanyEntity = {
            id: data.id,
            name: data.name,
            agentName: data.agent_name || '',
            industry: data.industry || '',
            phone: data.phone || '',
            email: data.email || '',
            plan: data.plan || 'pro',
            status: data.status || 'active',
            dataSpaceId: data.data_space_id || `vault-${data.id}`,
            monthlyCreditsLimit: data.monthly_credits_limit || 0,
            creditsUsed: data.credits_used || 0,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          };
          companiesStore.set(comp.id, comp);
          return comp;
        }
      } catch (e) {
        console.warn('[DB] Supabase company query error:', e);
      }
    }

    return null;
  },

  async getAllCompanies(): Promise<CompanyEntity[]> {
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.from('companies').select('*');
        if (data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            agentName: d.agent_name || '',
            industry: d.industry || '',
            phone: d.phone || '',
            email: d.email || '',
            plan: d.plan || 'starter',
            status: d.status || 'active',
            dataSpaceId: d.data_space_id,
            monthlyCreditsLimit: d.monthly_credits_limit || 0,
            creditsUsed: d.credits_used || 0,
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
        }
      } catch (e) {
        console.warn('[DB] Error loading companies from Supabase:', e);
      }
    }

    return Array.from(companiesStore.values());
  },

  async createCompany(params: {
    name: string;
    email?: string;
    phone?: string;
    industry?: string;
    agentName?: string;
    plan?: 'starter' | 'pro' | 'business';
  }): Promise<CompanyEntity> {
    const id = `c-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const newCompany: CompanyEntity = {
      id,
      name: params.name.trim(),
      agentName: params.agentName?.trim() || '',
      industry: params.industry?.trim() || '',
      email: params.email?.trim().toLowerCase(),
      phone: params.phone?.trim(),
      plan: params.plan || 'starter',
      status: 'active',
      dataSpaceId: `vault-${id}`,
      monthlyCreditsLimit: 0,
      creditsUsed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    companiesStore.set(id, newCompany);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('companies').insert({
          id: newCompany.id,
          name: newCompany.name,
          agent_name: newCompany.agentName,
          industry: newCompany.industry,
          email: newCompany.email,
          phone: newCompany.phone,
          plan: newCompany.plan,
          status: newCompany.status,
          data_space_id: newCompany.dataSpaceId,
          monthly_credits_limit: newCompany.monthlyCreditsLimit,
          credits_used: newCompany.creditsUsed
        });
      } catch (e) {
        console.warn('[DB] Supabase insert company error:', e);
      }
    }

    return newCompany;
  },

  async updateCompanyPlan(companyId: string, plan: 'starter' | 'pro' | 'business' | 'enterprise_125k'): Promise<boolean> {
    const comp = companiesStore.get(companyId);
    if (comp) {
      comp.plan = plan;
      comp.updatedAt = new Date().toISOString();
    }
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('companies').update({ plan, updated_at: new Date().toISOString() }).eq('id', companyId);
      } catch (_) {}
    }
    return true;
  },

  async addCredits(companyId: string, credits: number): Promise<boolean> {
    const comp = companiesStore.get(companyId);
    if (comp) {
      comp.monthlyCreditsLimit = (comp.monthlyCreditsLimit || 6000) + credits;
      comp.updatedAt = new Date().toISOString();
    }
    if (supabaseAdmin) {
      try {
        await supabaseAdmin.rpc('increment_credits', { p_company_id: companyId, p_amount: credits });
      } catch (_) {}
    }
    return true;
  },

  async updateCompanyAdminSettings(companyId: string, updates: {
    status?: 'active' | 'paused';
    plan?: 'starter' | 'pro' | 'business' | 'enterprise_125k';
    modules?: any[];
    name?: string;
    industry?: string;
    agentName?: string;
  }): Promise<CompanyEntity | null> {
    let comp = await this.findCompanyById(companyId);
    if (!comp) return null;

    if (updates.status) comp.status = updates.status;
    if (updates.plan) comp.plan = updates.plan;
    if (updates.name) comp.name = updates.name;
    if (updates.industry) comp.industry = updates.industry;
    if (updates.agentName) comp.agentName = updates.agentName;
    comp.updatedAt = new Date().toISOString();
    companiesStore.set(companyId, comp);

    const existingCtx = await this.getAgentContext(companyId);
    if (updates.modules && Array.isArray(updates.modules)) {
      existingCtx.modules = updates.modules;
    }
    if (updates.name) existingCtx.companyName = updates.name;
    if (updates.industry) existingCtx.industry = updates.industry;
    if (updates.status) existingCtx.companyStatus = updates.status;
    existingCtx.updatedAt = comp.updatedAt;
    agentContextStore.set(companyId, existingCtx);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('companies').update({
          status: comp.status,
          plan: comp.plan,
          name: comp.name,
          industry: comp.industry,
          agent_name: comp.agentName,
          updated_at: comp.updatedAt
        }).eq('id', companyId);
      } catch (_) {}
    }

    return comp;
  },

  async recordAIConversationUsage(companyId: string, tokensUsed = 1): Promise<void> {
    const comp = companiesStore.get(companyId);
    if (comp) {
      comp.creditsUsed = (comp.creditsUsed || 0) + tokensUsed;
      (comp as any).conversationsCount = ((comp as any).conversationsCount || 0) + 1;
      comp.updatedAt = new Date().toISOString();
      companiesStore.set(companyId, comp);
    }
  },

  // AI Agent Context - strictly company-isolated and supports per-agent knowledge, instructions & full dashboard tables
  async getAgentContext(companyId: string, agentId?: string): Promise<any> {
    let cached = agentContextStore.get(companyId);

    if (!cached && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('ai_agent_context')
          .select('*')
          .eq('company_id', companyId)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const row = data[0];
          cached = {
            companyId,
            companyName: row.company_name,
            agentName: row.agent_name,
            industry: row.industry,
            services: row.services ? JSON.parse(row.services) : undefined,
            documentsContext: row.documents_context,
            knowledgeBase: row.documents_context,
            instructions: row.instructions,
            customInstructions: row.instructions,
            strictRules: row.strict_rules ? row.strict_rules.split(' ; ') : undefined,
            openingHours: row.opening_hours,
            address: row.address,
            pricingRules: row.pricing_rules,
            personalContactName: row.personal_contact_name,
            personalContactPhone: row.personal_contact_phone,
            responseLatencySeconds: row.response_latency_seconds || 10,
            documents: [],
            products: [],
            orders: [],
            reservations: [],
            calendarSlots: [],
            invoices: [],
            customers: [],
            instructionsList: [],
            modules: [],
            agentsList: [],
            agentsMap: {}
          };
          agentContextStore.set(companyId, cached);
        }
      } catch (e) {
        console.warn('[DB] Supabase load agent context error:', e);
      }
    }

    if (!cached) {
      const comp = await this.findCompanyById(companyId);
      cached = {
        companyId,
        companyName: comp?.name || '',
        agentName: comp?.agentName || '',
        industry: comp?.industry || '',
        services: [],
        documentsContext: '',
        knowledgeBase: '',
        instructions: '',
        customInstructions: '',
        strictRules: [],
        openingHours: '',
        address: '',
        pricingRules: '',
        personalContactName: '',
        personalContactPhone: comp?.phone || '',
        responseLatencySeconds: 10,
        documents: [],
        products: [],
        orders: [],
        reservations: [],
        calendarSlots: [],
        invoices: [],
        customers: [],
        instructionsList: [],
        modules: [],
        agentsList: [],
        agentsMap: {}
      };
      agentContextStore.set(companyId, cached);
    }

    if (agentId && cached.agentsMap && cached.agentsMap[agentId]) {
      const agentSpecific = cached.agentsMap[agentId];
      return {
        ...cached,
        ...agentSpecific,
        knowledgeBase: agentSpecific.knowledgeBase || agentSpecific.documentsContext || cached.knowledgeBase || cached.documentsContext,
        documentsContext: agentSpecific.documentsContext || agentSpecific.knowledgeBase || cached.documentsContext || cached.knowledgeBase,
        customInstructions: agentSpecific.customInstructions || agentSpecific.instructions || cached.customInstructions || cached.instructions,
        instructions: agentSpecific.instructions || agentSpecific.customInstructions || cached.instructions || cached.customInstructions,
        companyName: cached.companyName,
        industry: cached.industry,
        openingHours: cached.openingHours,
        address: cached.address
      };
    }

    return cached;
  },

  async updateAgentContext(companyId: string, contextData: any): Promise<any> {
    const existing = await this.getAgentContext(companyId);
    const agentsMap = existing.agentsMap || {};

    const resolvedKnowledge = contextData.knowledgeBase ?? contextData.documentsContext;
    const resolvedInstructions = contextData.customInstructions ?? contextData.instructions;

    if (contextData.agentId) {
      const prevAgent = agentsMap[contextData.agentId] || {};
      const nextAgentKnow = resolvedKnowledge ?? prevAgent.knowledgeBase ?? prevAgent.documentsContext ?? existing.knowledgeBase ?? existing.documentsContext;
      const nextAgentInst = resolvedInstructions ?? prevAgent.customInstructions ?? prevAgent.instructions ?? existing.customInstructions ?? existing.instructions;

      agentsMap[contextData.agentId] = {
        ...prevAgent,
        agentId: contextData.agentId,
        agentName: contextData.agentName || prevAgent.agentName || existing.agentName,
        roleType: contextData.roleType || prevAgent.roleType || 'general',
        roleTitle: contextData.roleTitle || prevAgent.roleTitle || 'Conseiller IA',
        welcomeMessage: contextData.welcomeMessage ?? prevAgent.welcomeMessage,
        documentsContext: nextAgentKnow,
        knowledgeBase: nextAgentKnow,
        instructions: nextAgentInst,
        customInstructions: nextAgentInst,
        documents: contextData.documents ?? prevAgent.documents ?? existing.documents ?? [],
        updatedAt: new Date().toISOString()
      };
    }

    const nextGlobalKnow = resolvedKnowledge ?? existing.knowledgeBase ?? existing.documentsContext;
    const nextGlobalInst = resolvedInstructions ?? existing.customInstructions ?? existing.instructions;

    const updated = {
      ...existing,
      ...contextData,
      documentsContext: nextGlobalKnow,
      knowledgeBase: nextGlobalKnow,
      instructions: nextGlobalInst,
      customInstructions: nextGlobalInst,
      products: Array.isArray(contextData.products) ? contextData.products : existing.products || [],
      orders: Array.isArray(contextData.orders) ? contextData.orders : existing.orders || [],
      reservations: Array.isArray(contextData.reservations) ? contextData.reservations : existing.reservations || [],
      calendarSlots: Array.isArray(contextData.calendarSlots) ? contextData.calendarSlots : existing.calendarSlots || [],
      invoices: Array.isArray(contextData.invoices) ? contextData.invoices : existing.invoices || [],
      customers: Array.isArray(contextData.customers) ? contextData.customers : existing.customers || [],
      instructionsList: Array.isArray(contextData.instructionsList) ? contextData.instructionsList : existing.instructionsList || [],
      modules: Array.isArray(contextData.modules) ? contextData.modules : existing.modules || [],
      agentsList: Array.isArray(contextData.agentsList) ? contextData.agentsList : existing.agentsList || [],
      agentsMap,
      companyId,
      updatedAt: new Date().toISOString()
    };
    agentContextStore.set(companyId, updated);

    // Keep companiesStore synchronized with latest operational metrics for Super Admin Dashboard
    const comp = companiesStore.get(companyId);
    if (comp) {
      if (contextData.companyName) comp.name = contextData.companyName;
      if (contextData.industry) comp.industry = contextData.industry;
      if (contextData.agentName && (!contextData.agentId || contextData.agentId === 'agent-1')) {
        comp.agentName = contextData.agentName;
      }
      if (Array.isArray(updated.orders)) (comp as any).ordersCount = updated.orders.length;
      if (Array.isArray(updated.reservations) || Array.isArray(updated.calendarSlots)) {
        (comp as any).appointmentsCount = (updated.reservations?.length || 0) + (updated.calendarSlots?.length || 0);
      }
      comp.updatedAt = updated.updatedAt;
      companiesStore.set(companyId, comp);
    }

    if (supabaseAdmin) {
      try {
        const strictRulesText = Array.isArray(updated.strictRules)
          ? updated.strictRules.join(' ; ')
          : updated.strictRules || '';

        await supabaseAdmin.from('ai_agent_context').upsert({
          company_id: companyId,
          company_name: updated.companyName,
          agent_name: updated.agentName,
          industry: updated.industry,
          services: updated.services ? JSON.stringify(updated.services) : null,
          documents_context: updated.documentsContext,
          instructions: updated.instructions,
          strict_rules: strictRulesText,
          opening_hours: updated.openingHours,
          address: updated.address,
          pricing_rules: updated.pricingRules,
          personal_contact_name: updated.personalContactName,
          personal_contact_phone: updated.personalContactPhone,
          response_latency_seconds: updated.responseLatencySeconds,
          updated_at: new Date().toISOString()
        }, { onConflict: 'company_id' });
      } catch (e) {
        console.warn('[DB] Supabase upsert context notice:', e);
      }
    }

    return contextData.agentId ? agentsMap[contextData.agentId] : updated;
  },

  // Synchronisation complète du Dashboard Entreprise vers le Serveur & le Dashboard Super Admin
  async syncCompanyDashboardData(companyId: string, payload: any): Promise<any> {
    let comp = await this.findCompanyById(companyId);
    if (!comp) {
      comp = {
        id: companyId,
        name: payload.company?.name || payload.companyName || 'Mon Entreprise',
        agentName: payload.company?.agentName || payload.agentName || '',
        industry: payload.company?.industry || payload.industry || '',
        phone: payload.company?.phone || '',
        email: payload.company?.email || '',
        plan: payload.company?.plan || 'pro',
        status: payload.company?.status || 'active',
        dataSpaceId: payload.company?.dataSpaceId || `vault-${companyId}`,
        monthlyCreditsLimit: payload.company?.monthlyCreditsLimit || 0,
        creditsUsed: payload.company?.creditsUsed || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    if (payload.company) {
      if (payload.company.name) comp.name = payload.company.name;
      if (payload.company.industry !== undefined) comp.industry = payload.company.industry;
      if (payload.company.agentName !== undefined) comp.agentName = payload.company.agentName;
      if (payload.company.phone !== undefined) comp.phone = payload.company.phone;
      if (payload.company.email !== undefined) comp.email = payload.company.email;
      if (payload.company.plan) comp.plan = payload.company.plan;
      if (payload.company.status) comp.status = payload.company.status;
    }

    const legacyFakeIds = new Set([
      'agent-1', 'agent-2', 'agent-3',
      'ORD-8941', 'ORD-8940', 'ORD-8939',
      'RES-201', 'RES-202',
      'PRD-1', 'PRD-2', 'PRD-3',
      'INV-2025-01', 'INV-2025-02',
      'cust-1', 'cust-2', 'cust-3',
      'slot-1', 'slot-2'
    ]);
    const cleanArr = (arr: any[]) =>
      Array.isArray(arr) ? arr.filter((x) => x && !legacyFakeIds.has(x.id)) : [];

    const products = cleanArr(payload.products);
    const orders = cleanArr(payload.orders);
    const reservations = cleanArr(payload.reservations);
    const calendarSlots = cleanArr(payload.calendarSlots);
    const invoices = cleanArr(payload.invoices);
    const customers = cleanArr(payload.customers);
    const instructionsList = Array.isArray(payload.instructions) ? payload.instructions : (Array.isArray(payload.instructionsList) ? payload.instructionsList : []);
    const modules = Array.isArray(payload.modules) ? payload.modules : [];
    const agentsList = cleanArr(payload.agentsList);
    const documents = Array.isArray(payload.documents) ? payload.documents : [];

    (comp as any).ordersCount = orders.length;
    (comp as any).appointmentsCount = reservations.length + calendarSlots.length;
    (comp as any).productsCount = products.length;
    (comp as any).customersCount = customers.length;
    (comp as any).invoicesCount = invoices.length;
    (comp as any).agentsCount = agentsList.length;
    (comp as any).revenueXOF = orders.reduce((acc: number, o: any) => acc + (Number(o.totalAmount) || 0), 0) +
      invoices.filter((i: any) => i.status === 'Payée').reduce((acc: number, i: any) => acc + (Number(i.amount) || 0), 0);

    comp.updatedAt = new Date().toISOString();
    companiesStore.set(companyId, comp);

    const activeStrictRules = instructionsList.filter((i: any) => i.active).map((i: any) => i.rule);

    await this.updateAgentContext(companyId, {
      companyName: comp.name,
      industry: comp.industry,
      agentName: comp.agentName,
      knowledgeBase: payload.knowledgeBase,
      customInstructions: payload.customInstructions,
      strictRules: activeStrictRules.length > 0 ? activeStrictRules : undefined,
      documents,
      products,
      orders,
      reservations,
      calendarSlots,
      invoices,
      customers,
      instructionsList,
      modules,
      agentsList
    });

    // Also update each agent in agentsMap if agentsList is provided
    if (agentsList.length > 0) {
      for (const ag of agentsList) {
        await this.updateAgentContext(companyId, {
          agentId: ag.id,
          agentName: ag.name,
          roleType: ag.roleType,
          roleTitle: ag.roleTitle,
          welcomeMessage: ag.welcomeMessage,
          knowledgeBase: payload.knowledgeBase || ag.knowledgeText,
          customInstructions: ag.promptInstruction || payload.customInstructions,
          strictRules: activeStrictRules.length > 0 ? activeStrictRules : undefined,
          documents
        });
      }
    }

    return await this.getAgentContext(companyId);
  },

  // Vue globale synchronisée en temps réel pour le Super Admin Dashboard
  async getGlobalAdminSyncSnapshot(whatsAppGateway?: any): Promise<any> {
    const companies = await this.getAllCompanies();
    const enrichedCompanies: any[] = [];
    const allAgents: any[] = [];
    const allOrders: any[] = [];
    const allReservations: any[] = [];
    const allProducts: any[] = [];
    const allInvoices: any[] = [];
    const allCustomers: any[] = [];
    let allModules: any[] = [];

    for (const comp of companies) {
      const ctx = await this.getAgentContext(comp.id);
      const waSessions = whatsAppGateway ? whatsAppGateway.listCompanyAgentSessions(comp.id) : [];

      const products = Array.isArray(ctx.products) ? ctx.products : [];
      const orders = Array.isArray(ctx.orders) ? ctx.orders : [];
      const reservations = Array.isArray(ctx.reservations) ? ctx.reservations : [];
      const calendarSlots = Array.isArray(ctx.calendarSlots) ? ctx.calendarSlots : [];
      const invoices = Array.isArray(ctx.invoices) ? ctx.invoices : [];
      const customers = Array.isArray(ctx.customers) ? ctx.customers : [];
      const instructionsList = Array.isArray(ctx.instructionsList) ? ctx.instructionsList : [];
      const modules = Array.isArray(ctx.modules) ? ctx.modules : [];
      const documents = Array.isArray(ctx.documents) ? ctx.documents : [];

      if (modules.length > 0 && allModules.length === 0) {
        allModules = modules;
      }

      // Collect company agents (strictly those created by the user)
      const compAgents = Array.isArray(ctx.agentsList)
        ? ctx.agentsList
        : Object.values(ctx.agentsMap || {});

      const syncedAgents = compAgents.map((ag: any) => {
        const agentId = ag.id || ag.agentId || 'default';
        const liveWa = waSessions.find((s: any) => s.agentId === agentId) || waSessions.find((s: any) => s.agentId === 'default');
        const isWaConnected = liveWa?.status === 'connected';
        const agCtx = (ctx.agentsMap && ctx.agentsMap[agentId]) || ctx;

        const enrichedAgent = {
          id: agentId,
          name: ag.name || ag.agentName || comp.agentName || '',
          roleType: ag.roleType || 'customer_service',
          roleTitle: ag.roleTitle || '',
          companyId: comp.id,
          companyName: comp.name,
          industry: comp.industry,
          status: comp.status === 'paused' ? 'paused' : (ag.status || 'active'),
          whatsappStatus: isWaConnected ? 'connected' : (liveWa?.status || ag.whatsappStatus || 'disconnected'),
          whatsappNumber: liveWa?.phoneNumber || ag.whatsappNumber || comp.phone || '',
          knowledgeLength: (agCtx.knowledgeBase || agCtx.documentsContext || ag.knowledgeText || '').length,
          documentsCount: documents.length,
          rulesCount: (ctx.strictRules || []).length,
          conversationsCount: ag.conversationsCount || (comp as any).conversationsCount || 0,
          updatedAt: agCtx.updatedAt || comp.updatedAt
        };
        allAgents.push(enrichedAgent);
        return enrichedAgent;
      });

      orders.forEach((o: any) => allOrders.push({ ...o, companyId: comp.id, companyName: comp.name }));
      reservations.forEach((r: any) => allReservations.push({ ...r, companyId: comp.id, companyName: comp.name }));
      products.forEach((p: any) => allProducts.push({ ...p, companyId: comp.id, companyName: comp.name }));
      invoices.forEach((inv: any) => allInvoices.push({ ...inv, companyId: comp.id, companyName: comp.name }));
      customers.forEach((c: any) => allCustomers.push({ ...c, companyId: comp.id, companyName: comp.name }));

      const companyLogs = whatsappLogsStore.filter(l => l.companyId === comp.id);
      const revenueXOF = orders.reduce((acc: number, o: any) => acc + (Number(o.totalAmount) || 0), 0) +
        invoices.filter((i: any) => i.status === 'Payée').reduce((acc: number, i: any) => acc + (Number(i.amount) || 0), 0);

      enrichedCompanies.push({
        ...comp,
        ordersCount: orders.length || (comp as any).ordersCount || 0,
        appointmentsCount: (reservations.length + calendarSlots.length) || (comp as any).appointmentsCount || 0,
        productsCount: products.length,
        customersCount: customers.length,
        invoicesCount: invoices.length,
        documentsCount: documents.length,
        conversationsCount: Math.max((comp as any).conversationsCount || 0, companyLogs.length),
        revenueXOF,
        whatsappConnectedCount: syncedAgents.filter((a: any) => a.whatsappStatus === 'connected').length,
        agentsList: syncedAgents,
        products,
        orders,
        reservations,
        calendarSlots,
        invoices,
        customers,
        instructionsList,
        modules,
        documents,
        knowledgeBase: ctx.knowledgeBase || ctx.documentsContext || '',
        customInstructions: ctx.customInstructions || ctx.instructions || ''
      });
    }

    const whatsappLogs = await this.getWhatsAppLogs(undefined, 50);
    const transactions = await this.getTransactions();

    return {
      timestamp: new Date().toISOString(),
      companies: enrichedCompanies,
      agents: allAgents,
      orders: allOrders,
      reservations: allReservations,
      products: allProducts,
      invoices: allInvoices,
      customers: allCustomers,
      modules: allModules,
      whatsappLogs,
      transactions,
      stats: {
        totalCompanies: enrichedCompanies.length,
        activeCompanies: enrichedCompanies.filter(c => c.status === 'active').length,
        totalAgents: allAgents.length,
        connectedWhatsAppAgents: allAgents.filter(a => a.whatsappStatus === 'connected').length,
        totalOrders: allOrders.length,
        totalReservations: allReservations.length,
        totalProducts: allProducts.length,
        totalCustomers: allCustomers.length,
        totalConversations: Math.max(
          whatsappLogs.length,
          enrichedCompanies.reduce((acc, c) => acc + (c.conversationsCount || 0), 0)
        ),
        totalCreditsUsed: enrichedCompanies.reduce((acc, c) => acc + (c.creditsUsed || 0), 0),
        totalRevenueXOF: enrichedCompanies.reduce((acc, c) => acc + (c.revenueXOF || 0), 0)
      }
    };
  },

  // WhatsApp Logs - Isolated per company with privacy masking
  async logWhatsAppMessage(params: {
    companyId: string;
    sender: string;
    messageBody: string;
    aiResponse: string;
  }): Promise<void> {
    // Mask sensitive tokens / OTP numbers in logged text
    const sanitizeText = (txt: string) =>
      txt.replace(/\b\d{6}\b/g, '[CODE_MASQUÉ]');

    const entity: WhatsAppLogEntity = {
      id: `wlog-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      companyId: params.companyId,
      sender: params.sender,
      messageBody: sanitizeText(params.messageBody),
      aiResponse: sanitizeText(params.aiResponse),
      timestamp: new Date().toISOString()
    };

    whatsappLogsStore.unshift(entity);
    if (whatsappLogsStore.length > 500) {
      whatsappLogsStore.pop();
    }

    await this.recordAIConversationUsage(params.companyId, 1);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('whatsapp_logs').insert({
          id: entity.id,
          company_id: entity.companyId,
          sender: entity.sender,
          message_body: entity.messageBody,
          ai_response: entity.aiResponse,
          created_at: entity.timestamp
        });
      } catch (e) {
        console.warn('[DB] Supabase insert whatsapp_log error:', e);
      }
    }
  },

  async getWhatsAppLogs(companyId?: string, limit = 50): Promise<WhatsAppLogEntity[]> {
    if (supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('whatsapp_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            companyId: d.company_id,
            sender: d.sender,
            messageBody: d.message_body,
            aiResponse: d.ai_response,
            timestamp: d.created_at
          }));
        }
      } catch (e) {
        console.warn('[DB] Supabase fetch whatsapp logs error:', e);
      }
    }

    return whatsappLogsStore
      .filter(l => !companyId || l.companyId === companyId)
      .slice(0, limit);
  },

  // WhatsApp Consent & Opt-Out Management
  async optOutContact(companyId: string, phoneNumber: string, reason = 'Demande client'): Promise<void> {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const item: WhatsAppOptOutEntity = {
      id: `opt-${Date.now()}`,
      companyId,
      phoneNumber: cleanPhone,
      optedOutAt: new Date().toISOString(),
      reason
    };

    optOutsStore.push(item);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('whatsapp_opt_outs').upsert({
          company_id: companyId,
          phone_number: cleanPhone,
          opted_out_at: item.optedOutAt,
          reason: item.reason
        }, { onConflict: 'company_id,phone_number' });
      } catch (e) {
        console.warn('[DB] Supabase opt-out save error:', e);
      }
    }
  },

  async isContactOptedOut(companyId: string, phoneNumber: string): Promise<boolean> {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const local = optOutsStore.some(o => o.companyId === companyId && o.phoneNumber === cleanPhone);
    if (local) return true;

    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('whatsapp_opt_outs')
          .select('id')
          .eq('company_id', companyId)
          .eq('phone_number', cleanPhone)
          .limit(1);

        if (data && data.length > 0) return true;
      } catch (e) {
        console.warn('[DB] Supabase opt-out check error:', e);
      }
    }

    return false;
  },

  // Transactions & Atomic Crediting (Prevents Double-Credit)
  async createTransaction(tx: Omit<TransactionEntity, 'id' | 'createdAt'>): Promise<TransactionEntity> {
    const fullTx: TransactionEntity = {
      ...tx,
      id: `tx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      createdAt: new Date().toISOString()
    };

    transactionsStore.set(fullTx.refCommand, fullTx);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('transactions').insert({
          id: fullTx.id,
          ref_command: fullTx.refCommand,
          gateway: fullTx.gateway,
          plan_id: fullTx.planId,
          item_name: fullTx.itemName,
          amount: fullTx.amount,
          currency: fullTx.currency,
          credits_added: fullTx.creditsAdded,
          status: fullTx.status,
          payment_method: fullTx.paymentMethod,
          company_id: fullTx.companyId,
          company_name: fullTx.companyName,
          client_name: fullTx.clientName,
          client_phone: fullTx.clientPhone,
          token: fullTx.token,
          receipt_url: fullTx.receiptUrl,
          created_at: fullTx.createdAt
        });
      } catch (e) {
        console.warn('[DB] Supabase insert transaction error:', e);
      }
    }

    return fullTx;
  },

  async getTransactionByRef(refCommand: string): Promise<TransactionEntity | null> {
    const local = transactionsStore.get(refCommand);
    if (local) return local;

    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('transactions')
          .select('*')
          .eq('ref_command', refCommand)
          .single();

        if (data) {
          return {
            id: data.id,
            refCommand: data.ref_command,
            gateway: data.gateway,
            planId: data.plan_id,
            itemName: data.item_name,
            amount: data.amount,
            currency: data.currency,
            creditsAdded: data.credits_added,
            status: data.status,
            paymentMethod: data.payment_method,
            companyId: data.company_id,
            companyName: data.company_name,
            clientName: data.client_name,
            clientPhone: data.client_phone,
            token: data.token,
            receiptUrl: data.receipt_url,
            createdAt: data.created_at,
            paidAt: data.paid_at
          };
        }
      } catch (e) {
        console.warn('[DB] Supabase get transaction error:', e);
      }
    }

    return null;
  },

  async getTransactions(companyId?: string): Promise<TransactionEntity[]> {
    if (supabaseAdmin) {
      try {
        let query = supabaseAdmin
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (companyId) {
          query = query.eq('company_id', companyId);
        }

        const { data } = await query;
        if (data) {
          return data.map((d: any) => ({
            id: d.id,
            refCommand: d.ref_command,
            gateway: d.gateway,
            planId: d.plan_id,
            itemName: d.item_name,
            amount: d.amount,
            currency: d.currency,
            creditsAdded: d.credits_added,
            status: d.status,
            paymentMethod: d.payment_method,
            companyId: d.company_id,
            companyName: d.company_name,
            clientName: d.client_name,
            clientPhone: d.client_phone,
            token: d.token,
            receiptUrl: d.receipt_url,
            createdAt: d.created_at,
            paidAt: d.paid_at
          }));
        }
      } catch (e) {
        console.warn('[DB] Supabase list transactions error:', e);
      }
    }

    return Array.from(transactionsStore.values())
      .filter(t => !companyId || t.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Atomic confirmation & crediting: exactly once
  async confirmAndCreditTransaction(params: {
    refCommand: string;
    receiptUrl?: string;
    paymentMethod?: string;
  }): Promise<{ success: boolean; transaction?: TransactionEntity; error?: string }> {
    const tx = await this.getTransactionByRef(params.refCommand);
    if (!tx) {
      return { success: false, error: 'Transaction introuvable.' };
    }

    // Idempotency: If already credited, do NOT credit again
    if (tx.status === 'success') {
      return { success: true, transaction: tx };
    }

    tx.status = 'success';
    tx.paidAt = new Date().toISOString();
    if (params.receiptUrl) tx.receiptUrl = params.receiptUrl;
    if (params.paymentMethod) tx.paymentMethod = params.paymentMethod;

    transactionsStore.set(tx.refCommand, tx);

    // Credit company credits and update plan
    const company = await this.findCompanyById(tx.companyId);
    if (company) {
      company.monthlyCreditsLimit = (company.monthlyCreditsLimit || 0) + (tx.creditsAdded || 0);
      if (tx.planId && ['starter', 'pro', 'business'].includes(tx.planId)) {
        company.plan = tx.planId as any;
      }
      company.updatedAt = new Date().toISOString();
      companiesStore.set(company.id, company);

      if (supabaseAdmin) {
        try {
          await supabaseAdmin.from('companies').update({
            monthly_credits_limit: company.monthlyCreditsLimit,
            plan: company.plan,
            updated_at: company.updatedAt
          }).eq('id', company.id);
        } catch (e) {
          console.warn('[DB] Supabase company credit update error:', e);
        }
      }
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('transactions').update({
          status: 'success',
          paid_at: tx.paidAt,
          receipt_url: tx.receiptUrl,
          payment_method: tx.paymentMethod
        }).eq('ref_command', tx.refCommand);
      } catch (e) {
        console.warn('[DB] Supabase transaction update error:', e);
      }
    }

    console.log(`[DB] ✅ Transaction ${tx.refCommand} validée avec succès. Crédits ajoutés : +${tx.creditsAdded}`);
    return { success: true, transaction: tx };
  }
};
