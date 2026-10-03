import { AuthSession, CompanyProfile } from '../types.ts';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('smg_auth_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('smg_auth_token', token);
    } else {
      localStorage.removeItem('smg_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  public async fetchMe(): Promise<{ success: boolean; user?: any; company?: CompanyProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getHeaders()
      });
      if (!res.ok) {
        return { success: false, error: 'Session expirée' };
      }
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erreur réseau' };
    }
  }

  public async login(payload: {
    identifier: string;
    authType: 'otp' | 'password';
    password?: string;
    code?: string;
  }): Promise<{ success: boolean; token?: string; user?: any; company?: CompanyProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erreur de connexion au serveur.' };
    }
  }

  public async register(payload: {
    companyName: string;
    fullName: string;
    email: string;
    phone: string;
    password?: string;
  }): Promise<{ success: boolean; token?: string; user?: any; company?: CompanyProfile; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erreur de création de compte.' };
    }
  }

  public async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: this.getHeaders() });
    } finally {
      this.setToken(null);
    }
  }

  public async requestOtp(identifier: string, type: 'email' | 'whatsapp'): Promise<{ success: boolean; message?: string; error?: string; sentViaWhatsApp?: boolean }> {
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erreur lors de l\'envoi du code.' };
    }
  }

  public async verifyOtp(identifier: string, code: string): Promise<{ success: boolean; verified?: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erreur de vérification du code.' };
    }
  }

  public async getWhatsAppLogs(limit = 30): Promise<{ success: boolean; logs?: any[]; error?: string }> {
    try {
      const res = await fetch(`/api/whatsapp/logs?limit=${limit}`, {
        headers: this.getHeaders()
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erreur de chargement des journaux.' };
    }
  }

  public async updateContext(contextData: Record<string, any>): Promise<{ success: boolean; context?: any; error?: string }> {
    try {
      const res = await fetch('/api/ai/context', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(contextData)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erreur mise à jour contexte' };
    }
  }

  public async getTransactions(): Promise<{ success: boolean; transactions?: any[]; error?: string }> {
    try {
      const res = await fetch('/api/payments/transactions', {
        headers: this.getHeaders()
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erreur de chargement des transactions.' };
    }
  }
}

export const api = new ApiClient();
