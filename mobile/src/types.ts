export type MobileTab = 'home' | 'whatsapp' | 'ai_agent' | 'wallet' | 'settings';

export interface MobileStats {
  creditsRemaining: number;
  monthlyLimit: number;
  messagesSentToday: number;
  whatsappStatus: 'connected' | 'qr_ready' | 'connecting' | 'disconnected';
  connectedPhone: string | null;
  agentName: string;
  autoPilotEnabled: boolean;
  responseLatencySeconds: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export interface TransactionItem {
  id: string;
  amountXOF: number;
  credits: number;
  date: string;
  method: 'Wave' | 'Orange Money' | 'PayDunya' | 'Carte';
  status: 'success' | 'pending';
}
