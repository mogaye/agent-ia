import { CompanyProfile } from '../types';

const STORAGE_KEY = 'msgflow_registered_accounts_v5_zero_fake';
const SESSION_KEY = 'msgflow_active_session_v1';
const COMPANY_DATA_PREFIX = 'msgflow_data_v5_zero_fake_';

// Purge legacy localStorage keys that might hold old fake demo data
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        k.startsWith('msgflow_') &&
        k !== STORAGE_KEY &&
        k !== SESSION_KEY &&
        k !== 'msgflow_auth_token' &&
        !k.startsWith(COMPANY_DATA_PREFIX)
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  }
} catch (_) {
  // Ignore storage access errors
}

const LEGACY_FAKE_IDS = new Set([
  'agent-1',
  'agent-2',
  'agent-3',
  'ORD-8941',
  'ORD-8940',
  'ORD-8939',
  'RES-201',
  'RES-202',
  'PRD-1',
  'PRD-2',
  'PRD-3',
  'INV-2025-01',
  'INV-2025-02',
  'cust-1',
  'cust-2',
  'cust-3',
  'slot-1',
  'slot-2'
]);

const LEGACY_FAKE_PHONES = new Set([
  '+221 77 123 45 67',
  '+221 77 234 56 78',
  '+221 77 345 67 89',
  '+221 70 590 87 25',
  '+221 78 123 45 67',
  '+221 76 987 65 43'
]);

function sanitizeCompanyData(data: any): any {
  if (!data || typeof data !== 'object') return null;
  const cleanList = (arr: any[]) =>
    Array.isArray(arr)
      ? arr.filter(
          (item) =>
            item &&
            !LEGACY_FAKE_IDS.has(item.id) &&
            !LEGACY_FAKE_PHONES.has(item.whatsappNumber) &&
            !LEGACY_FAKE_PHONES.has(item.phone)
        )
      : [];

  return {
    ...data,
    agentsList: cleanList(data.agentsList),
    customers: cleanList(data.customers),
    orders: cleanList(data.orders),
    reservations: cleanList(data.reservations),
    calendarSlots: cleanList(data.calendarSlots),
    products: cleanList(data.products),
    invoices: cleanList(data.invoices)
  };
}

export const VIP_COMPANY: CompanyProfile = {
  id: 'c-mgaye60000',
  name: 'Entreprise Mamadou Gaye (VIP)',
  agentName: '',
  industry: '',
  phone: '',
  email: 'mgaye60000@gmail.com',
  plan: 'enterprise_125k',
  planPriceXOF: 0,
  status: 'active',
  dataSpaceId: 'vault-c-mgaye60000',
  monthlyCreditsLimit: 0,
  creditsUsed: 0,
  conversationsCount: 0,
  clientsCount: 0,
  ordersCount: 0,
  appointmentsCount: 0,
  isVipFree: true
};

export const accountStorage = {
  async getAllRegisteredAccounts(): Promise<CompanyProfile[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  createVirginAccount(name: string, customId?: string, phone?: string, email?: string): { company: CompanyProfile } {
    const isVip = email?.trim().toLowerCase() === 'mgaye60000@gmail.com';
    const id = customId || (isVip ? 'c-mgaye60000' : `c-${Date.now()}`);
    const company: CompanyProfile = {
      id,
      name: name || (isVip ? 'Entreprise Mamadou Gaye (VIP)' : 'Mon Entreprise'),
      agentName: '',
      industry: '',
      phone: phone || '',
      email: email || '',
      plan: isVip ? 'enterprise_125k' : 'pro',
      planPriceXOF: 0,
      status: 'active',
      dataSpaceId: `vault-${id}`,
      monthlyCreditsLimit: 0,
      creditsUsed: 0,
      conversationsCount: 0,
      clientsCount: 0,
      ordersCount: 0,
      appointmentsCount: 0,
      isVipFree: isVip
    };

    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const list: CompanyProfile[] = existing ? JSON.parse(existing) : [];
      if (!list.some(c => c.id === company.id)) {
        list.push(company);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('accountStorage write error:', e);
    }

    return { company };
  },

  saveAccount(company: CompanyProfile) {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const list: CompanyProfile[] = existing ? JSON.parse(existing) : [];
      const idx = list.findIndex(c => c.id === company.id);
      if (idx >= 0) {
        list[idx] = company;
      } else {
        list.push(company);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('saveAccount error:', e);
    }
  },

  saveActiveSession(session: any, company?: CompanyProfile) {
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ session, company }));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.warn('saveActiveSession error:', e);
    }
  },

  getActiveSession(): { session: any | null; company: CompanyProfile | null } {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return { session: null, company: null };
      const data = JSON.parse(raw);
      return {
        session: data.session || null,
        company: data.company || null
      };
    } catch (e) {
      return { session: null, company: null };
    }
  },

  clearActiveSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn('clearActiveSession error:', e);
    }
  },

  saveCompanyData(companyId: string, data: any) {
    try {
      const clean = sanitizeCompanyData(data);
      localStorage.setItem(`${COMPANY_DATA_PREFIX}${companyId}`, JSON.stringify(clean));
    } catch (e) {
      console.warn('saveCompanyData error:', e);
    }
  },

  getCompanyData(companyId: string): any | null {
    try {
      const raw = localStorage.getItem(`${COMPANY_DATA_PREFIX}${companyId}`);
      if (!raw) return null;
      return sanitizeCompanyData(JSON.parse(raw));
    } catch (e) {
      return null;
    }
  }
};
