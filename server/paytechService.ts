import crypto from 'crypto';
import { db } from './db.ts';
import { getPlanOrThrow } from './pricing.ts';
import { TransactionEntity } from './types.ts';

export interface PaytechConfig {
  apiKey: string;
  apiSecret: string;
  env: 'test' | 'prod';
  currency: string;
  isConfigured: boolean;
}

class PaytechService {
  private getApiKey(): string {
    return (process.env.PAYTECH_API_KEY || '').trim();
  }

  private getApiSecret(): string {
    return (process.env.PAYTECH_API_SECRET || '').trim();
  }

  private getEnv(): 'test' | 'prod' {
    return (process.env.PAYTECH_ENV as 'test' | 'prod') || 'prod';
  }

  public getConfig(): { env: string; currency: string; isConfigured: boolean; maskedApiKey: string } {
    const key = this.getApiKey();
    return {
      env: this.getEnv(),
      currency: 'XOF',
      isConfigured: Boolean(key && this.getApiSecret()),
      maskedApiKey: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : ''
    };
  }

  public verifyIpnSignature(headers: Record<string, string | string[] | undefined>): boolean {
    const apiSecret = this.getApiSecret();
    if (!apiSecret) {
      console.warn('[PayTech] Refus webhook : PAYTECH_API_SECRET non configuré.');
      return false;
    }

    const receivedSecretHash = (headers['api_secret_sha256'] || headers['api-secret-sha256']) as string;
    const receivedKeyHash = (headers['api_key_sha256'] || headers['api-key-sha256']) as string;

    if (!receivedSecretHash) {
      console.warn('[PayTech] ❌ Webhook rejeté : En-tête api_secret_sha256 manquant.');
      return false;
    }

    try {
      const calculatedSecretHash = crypto.createHash('sha256').update(apiSecret).digest('hex');
      const hashBuf = Buffer.from(calculatedSecretHash, 'hex');
      const recvBuf = Buffer.from(receivedSecretHash, 'hex');

      if (hashBuf.length !== recvBuf.length || !crypto.timingSafeEqual(hashBuf, recvBuf)) {
        console.warn('[PayTech] ❌ Webhook rejeté : Signature secrète invalide.');
        return false;
      }

      if (receivedKeyHash && this.getApiKey()) {
        const calculatedKeyHash = crypto.createHash('sha256').update(this.getApiKey()).digest('hex');
        const keyBuf = Buffer.from(calculatedKeyHash, 'hex');
        const recvKeyBuf = Buffer.from(receivedKeyHash, 'hex');
        if (keyBuf.length !== recvKeyBuf.length || !crypto.timingSafeEqual(keyBuf, recvKeyBuf)) {
          console.warn('[PayTech] ❌ Webhook rejeté : Signature clé API invalide.');
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('[PayTech] Erreur vérification signature webhook:', err);
      return false;
    }
  }

  public async createPaymentRequest(params: {
    planId: string;
    paymentMethod: 'Wave' | 'Orange Money' | 'Carte Bancaire' | 'Free Money' | 'PayTech';
    clientName: string;
    clientPhone: string;
    companyId: string;
    companyName: string;
    appUrl?: string;
  }): Promise<{ success: boolean; token?: string; redirectUrl?: string; refCommand: string; error?: string }> {
    const plan = getPlanOrThrow(params.planId);
    const refCommand = `PAY-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const amount = plan.priceXOF;
    const currency = 'XOF';

    const baseUrl = (process.env.APP_URL || params.appUrl || 'https://smgflow.pro').replace(/\/$/, '');

    // Register transaction in DB
    const tx = await db.createTransaction({
      refCommand,
      gateway: 'paytech',
      planId: plan.id,
      itemName: plan.name,
      amount,
      currency,
      creditsAdded: plan.credits,
      status: 'pending',
      paymentMethod: params.paymentMethod,
      companyId: params.companyId,
      companyName: params.companyName,
      clientName: params.clientName,
      clientPhone: params.clientPhone
    });

    const apiKey = this.getApiKey();
    const apiSecret = this.getApiSecret();

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        refCommand,
        error: 'La passerelle de paiement PayTech est en attente des clés API marchandes de production.'
      };
    }

    try {
      const payload = {
        item_name: plan.name,
        item_price: amount,
        currency: currency,
        ref_command: refCommand,
        command_name: `Abonnement ${plan.name} - SMG Flow`,
        env: this.getEnv(),
        ipn_url: `${baseUrl}/api/paytech/ipn`,
        success_url: `${baseUrl}/?payment=success&ref=${refCommand}`,
        cancel_url: `${baseUrl}/?payment=cancel&ref=${refCommand}`,
        custom_field: JSON.stringify({
          refCommand,
          companyId: params.companyId,
          planId: plan.id,
          creditsAdded: plan.credits,
          clientPhone: params.clientPhone
        })
      };

      const response = await fetch('https://paytech.sn/api/payment/request-payment', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'API_KEY': apiKey,
          'API_SECRET': apiSecret
        },
        body: JSON.stringify(payload)
      });

      const data: any = await response.json();

      if (data && (data.success === 1 || data.token)) {
        const redirectUrl = data.redirect_url || data.redirectUrl || `https://paytech.sn/payment/checkout/${data.token}`;
        return {
          success: true,
          token: data.token,
          redirectUrl,
          refCommand
        };
      } else {
        const errMsg = data?.message || data?.error || 'Erreur lors de la communication avec PayTech.';
        console.error('[PayTech] Échec API PayTech:', errMsg);
        return {
          success: false,
          refCommand,
          error: `Échec d'initialisation du paiement PayTech: ${errMsg}`
        };
      }
    } catch (err: any) {
      console.error('[PayTech] Erreur réseau:', err);
      return {
        success: false,
        refCommand,
        error: 'Impossible de joindre le serveur de paiement PayTech.'
      };
    }
  }

  public async handleIpnNotification(body: any, headers: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const isValid = this.verifyIpnSignature(headers);
    if (!isValid) {
      return { success: false, message: 'Signature invalide.' };
    }

    const { ref_command, custom_field, item_price } = body || {};
    let ref = ref_command;

    if (!ref && custom_field) {
      try {
        const parsed = JSON.parse(custom_field);
        ref = parsed.refCommand;
      } catch (_) {}
    }

    if (!ref) {
      return { success: false, message: 'Référence de commande manquante.' };
    }

    const existingTx = await db.getTransactionByRef(ref);
    if (!existingTx) {
      return { success: false, message: 'Transaction inconnue.' };
    }

    // Verify amount matches
    if (item_price && Number(item_price) !== existingTx.amount) {
      console.warn(`[PayTech] ❌ Montant IPN falsifié (${item_price}) vs attendu (${existingTx.amount})`);
      return { success: false, message: 'Montant non conforme.' };
    }

    const result = await db.confirmAndCreditTransaction({
      refCommand: ref,
      paymentMethod: existingTx.paymentMethod
    });

    return {
      success: result.success,
      message: result.success ? 'Transaction confirmée et créditée.' : (result.error || 'Erreur confirmation')
    };
  }
}

export const paytechService = new PaytechService();
