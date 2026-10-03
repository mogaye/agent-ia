import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from './db.ts';

const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
// Strip potential /rest/v1 or trailing slashes
const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

let serverClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    serverClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (err) {
    console.warn('[Supabase Server] Initialization notice:', err);
    serverClient = null;
  }
}

export const supabaseServer: SupabaseClient | null = serverClient;

// Helper: Log WhatsApp conversation to database with company isolation
export async function logWhatsAppMessageToSupabase(
  sender: string,
  messageBody: string,
  aiResponse: string,
  companyId = 'c-smgflow-default'
): Promise<void> {
  await db.logWhatsAppMessage({
    companyId,
    sender,
    messageBody,
    aiResponse
  });
}

// Helper: Load agent context for a company
export async function loadAgentContextFromSupabase(companyId = 'c-smgflow-default'): Promise<any | null> {
  return await db.getAgentContext(companyId);
}

// Helper: Save or sync agent context to database
export async function syncAgentContextToSupabase(context: {
  companyId?: string;
  companyName: string;
  agentName: string;
  industry?: string;
  instructions?: string;
  strictRules?: string[] | string;
}): Promise<void> {
  const companyId = context.companyId || 'c-smgflow-default';
  await db.updateAgentContext(companyId, context);
}

// Helper: Test Supabase connection safely without exposing keys or credentials
export async function testSupabaseServerConnection(): Promise<{ connected: boolean; url: string; error?: string }> {
  if (!supabaseServer) {
    return {
      connected: false,
      url: SUPABASE_URL ? 'Configurée' : 'Non configurée',
      error: 'Variables SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non définies dans .env.'
    };
  }

  try {
    const { error } = await supabaseServer.from('companies').select('id').limit(1);
    if (error) {
      return { connected: false, url: 'Supabase Cloud', error: error.message };
    }
    return { connected: true, url: 'Supabase Cloud' };
  } catch (err: any) {
    return { connected: false, url: 'Supabase Cloud', error: err?.message || String(err) };
  }
}
