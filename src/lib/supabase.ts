import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { api } from './api.ts';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
// Strip potential trailing /rest/v1 or trailing slashes
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let supabaseInstance: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  } catch (err) {
    console.warn('[Supabase Client] Non-fatal initialization error:', err);
    supabaseInstance = null;
  }
}

export const supabase: SupabaseClient | null = supabaseInstance;

export const supabaseService = {
  async getWhatsAppLogs(limit = 20): Promise<any[]> {
    const res = await api.getWhatsAppLogs(limit);
    return res.logs || [];
  },

  async requestOtp(
    identifier: string,
    type: 'email' | 'whatsapp'
  ): Promise<{ 
    success: boolean; 
    message?: string;
    error?: string;
    sentViaWhatsApp?: boolean;
  }> {
    return await api.requestOtp(identifier, type);
  },

  async verifyOtp(
    identifier: string,
    code: string
  ): Promise<{ success: boolean; verified?: boolean; message?: string; error?: string }> {
    return await api.verifyOtp(identifier, code);
  },

  async saveInstruction(instruction: any): Promise<void> {
    try {
      await fetch('/api/ai/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`
        },
        body: JSON.stringify({
          instructions: instruction.rule
        })
      });
    } catch (e) {
      console.warn('saveInstruction notice:', e);
    }
  },

  async getInstructions(): Promise<any[] | null> {
    try {
      const res = await fetch('/api/ai/context', {
        headers: {
          'Authorization': `Bearer ${api.getToken()}`
        }
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.strictRules && Array.isArray(data.strictRules)) {
        return data.strictRules.map((rule: string, i: number) => ({
          id: `rule-${i}`,
          rule,
          category: 'Sécurité',
          active: true,
          createdAt: 'Actif',
          source: 'owner_prompt'
        }));
      }
      return null;
    } catch {
      return null;
    }
  }
};
