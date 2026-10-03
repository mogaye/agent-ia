import crypto from 'crypto';
import { db } from './db.ts';
import { getPlanOrThrow } from './pricing.ts';

export interface PaydunyaConfig {
  masterKey: string;
  publicKey?: string;
  privateKey: string;
  token: string;
  mode: 'test' | 'live';
}

class PaydunyaService {
  private runtimeConfig: Partial<PaydunyaConfig> & { directWavePhone?: string; directOmPhone?: string } = {};

  public updateConfig(cfg: Partial<PaydunyaConfig> & { directWavePhone?: string; directOmPhone?: string }) {
    if (cfg.masterKey && !cfg.masterKey.includes('...')) this.runtimeConfig.masterKey = cfg.masterKey.trim();
    if (cfg.publicKey && !cfg.publicKey.includes('...')) this.runtimeConfig.publicKey = cfg.publicKey.trim();
    if (cfg.privateKey) this.runtimeConfig.privateKey = cfg.privateKey.trim();
    if (cfg.token && !cfg.token.includes('...')) this.runtimeConfig.token = cfg.token.trim();
    if (cfg.mode) this.runtimeConfig.mode = cfg.mode;
    if (cfg.directWavePhone) this.runtimeConfig.directWavePhone = cfg.directWavePhone;
    if (cfg.directOmPhone) this.runtimeConfig.directOmPhone = cfg.directOmPhone;
  }

  private getMasterKey(): string {
    return (this.runtimeConfig.masterKey || process.env.PAYDUNYA_MASTER_KEY || '').trim();
  }

  private getPublicKey(): string {
    return (this.runtimeConfig.publicKey || process.env.PAYDUNYA_PUBLIC_KEY || '').trim();
  }

  private getPrivateKey(): string {
    return (this.runtimeConfig.privateKey || process.env.PAYDUNYA_PRIVATE_KEY || '').trim();
  }

  private getToken(): string {
    return (this.runtimeConfig.token || process.env.PAYDUNYA_TOKEN || '').trim();
  }

  private getMode(): 'test' | 'live' {
    if (this.runtimeConfig.mode) return this.runtimeConfig.mode;
    const raw = (process.env.PAYDUNYA_MODE || 'live').toLowerCase().trim();
    if (raw.includes('test') || raw.includes('sandbox')) return 'test';
    return 'live';
  }

  public getConfig() {
    const master = this.getMasterKey();
    const token = this.getToken();
    return {
      masterKey: master ? `${master.slice(0, 4)}...${master.slice(-4)}` : '',
      publicKey: this.getPublicKey() ? `${this.getPublicKey().slice(0, 6)}...` : '',
      token: token ? `${token.slice(0, 4)}...` : '',
      mode: this.getMode(),
      directWavePhone: this.runtimeConfig.directWavePhone || '',
      directOmPhone: this.runtimeConfig.directOmPhone || '',
      currency: 'XOF',
      isConfigured: Boolean(master && this.getPrivateKey() && token)
    };
  }

  public verifyIpnHash(invoiceToken: string, receivedHash: string): boolean {
    const masterKey = this.getMasterKey();
    if (!masterKey || !receivedHash) {
      console.warn('[PayDunya] ❌ Rejet IPN : MasterKey absente ou hash manquant.');
      return false;
    }

    try {
      const computed = crypto.createHash('sha512').update(`${masterKey}${invoiceToken}`).digest('hex');
      const compBuf = Buffer.from(computed.toLowerCase());
      const recvBuf = Buffer.from(receivedHash.toLowerCase());

      if (compBuf.length !== recvBuf.length || !crypto.timingSafeEqual(compBuf, recvBuf)) {
        console.warn('[PayDunya] ❌ Rejet IPN : Hash SHA-512 non conforme.');
        return false;
      }

      return true;
    } catch (err) {
      console.error('[PayDunya] Erreur validation hash IPN:', err);
      return false;
    }
  }

  public async createInvoice(params: {
    planId: string;
    paymentMethod: string;
    clientName: string;
    clientPhone: string;
    companyId: string;
    companyName: string;
    appUrl?: string;
  }): Promise<{
    success: boolean;
    token?: string;
    redirectUrl?: string;
    refCommand: string;
    error?: string;
  }> {
    const plan = getPlanOrThrow(params.planId);
    const refCommand = `PD-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const amount = plan.priceXOF;

    const baseUrl = (process.env.APP_URL || params.appUrl || 'https://smgflow.pro').replace(/\/$/, '');

    // Record pending transaction in DB
    await db.createTransaction({
      refCommand,
      gateway: 'paydunya',
      planId: plan.id,
      itemName: plan.name,
      amount,
      currency: 'XOF',
      creditsAdded: plan.credits,
      status: 'pending',
      paymentMethod: params.paymentMethod,
      companyId: params.companyId,
      companyName: params.companyName,
      clientName: params.clientName,
      clientPhone: params.clientPhone
    });

    const masterKey = this.getMasterKey();
    const privateKey = this.getPrivateKey();
    const token = this.getToken();

    if (!masterKey || !privateKey || !token) {
      return {
        success: false,
        refCommand,
        error: 'Les clés API marchandes PayDunya ne sont pas encore configurées dans la console Super Admin.'
      };
    }

    const endpoint = this.getMode() === 'live'
      ? 'https://app.paydunya.com/api/v1/checkout-invoice/create'
      : 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create';

    try {
      const payload = {
        invoice: {
          total_amount: amount,
          description: `${plan.name} - SMG Flow Sénégal`
        },
        store: {
          name: 'SMG Flow Sénégal',
          tagline: 'Plateforme d\'automatisation et agents IA WhatsApp pour entreprises',
          phone_number: params.clientPhone,
          postal_address: 'Dakar, Sénégal'
        },
        actions: {
          cancel_url: `${baseUrl}/?payment=cancel&ref=${refCommand}`,
          return_url: `${baseUrl}/?payment=success&ref=${refCommand}`,
          callback_url: `${baseUrl}/api/paydunya/ipn`
        },
        custom_data: {
          refCommand,
          planId: plan.id,
          companyId: params.companyId,
          creditsAdded: plan.credits,
          clientName: params.clientName,
          clientPhone: params.clientPhone
        }
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': masterKey,
        'PAYDUNYA-PRIVATE-KEY': privateKey,
        'PAYDUNYA-TOKEN': token
      };

      const pubKey = this.getPublicKey();
      if (pubKey) {
        headers['PAYDUNYA-PUBLIC-KEY'] = pubKey;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data: any = await res.json();

      if (data.response_code === '00' || data.token) {
        const invoiceToken = data.token;
        const invoiceUrl = data.response_text && data.response_text.startsWith('http')
          ? data.response_text
          : (this.getMode() === 'live'
              ? `https://app.paydunya.com/checkout/invoice/${invoiceToken}`
              : `https://app.paydunya.com/sandbox-checkout/invoice/${invoiceToken}`);

        return {
          success: true,
          token: invoiceToken,
          redirectUrl: invoiceUrl,
          refCommand
        };
      } else {
        const errorMsg = data.response_text || data.description || 'Erreur lors de la création de la facture PayDunya.';
        console.error('[PayDunya] Erreur API:', errorMsg);
        return {
          success: false,
          refCommand,
          error: `Échec PayDunya : ${errorMsg}`
        };
      }
    } catch (err: any) {
      console.error('[PayDunya] Erreur réseau:', err);
      return {
        success: false,
        refCommand,
        error: 'Impossible de joindre les serveurs PayDunya.'
      };
    }
  }

  public async handleIpnNotification(body: any): Promise<{ success: boolean; message: string }> {
    const data = body?.data || body || {};
    const invoiceToken = data.token || body?.token;
    const receivedHash = data.hash || body?.hash;

    if (!invoiceToken || !receivedHash) {
      return { success: false, message: 'Paramètres IPN manquants.' };
    }

    const isValid = this.verifyIpnHash(invoiceToken, receivedHash);
    if (!isValid) {
      return { success: false, message: 'Signature de webhook PayDunya invalide.' };
    }

    // Verify invoice status with PayDunya server before crediting
    const masterKey = this.getMasterKey();
    const privateKey = this.getPrivateKey();
    const token = this.getToken();

    const verifyEndpoint = this.getMode() === 'live'
      ? `https://app.paydunya.com/api/v1/checkout-invoice/confirm/${invoiceToken}`
      : `https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/${invoiceToken}`;

    try {
      const verifyRes = await fetch(verifyEndpoint, {
        method: 'GET',
        headers: {
          'PAYDUNYA-MASTER-KEY': masterKey,
          'PAYDUNYA-PRIVATE-KEY': privateKey,
          'PAYDUNYA-TOKEN': token
        }
      });

      const verifyData: any = await verifyRes.json();
      const status = verifyData.status || data.status;

      if (status !== 'completed' && verifyData.response_code !== '00') {
        console.warn(`[PayDunya] Facture ${invoiceToken} non complétée (statut: ${status}).`);
        return { success: false, message: `Facture non payée (statut: ${status}).` };
      }

      const customData = verifyData.custom_data || data.custom_data || {};
      const ref = customData.refCommand;

      if (!ref) {
        return { success: false, message: 'Référence personnalisée manquante.' };
      }

      const receiptUrl = verifyData.receipt_url || data.receipt_url;
      const creditResult = await db.confirmAndCreditTransaction({
        refCommand: ref,
        receiptUrl
      });

      return {
        success: creditResult.success,
        message: creditResult.success ? 'Facture validée et compte crédité.' : (creditResult.error || 'Erreur confirmation')
      };
    } catch (err: any) {
      console.error('[PayDunya] Erreur vérification statut auprès du serveur:', err);
      return { success: false, message: 'Échec de vérification du statut auprès de PayDunya.' };
    }
  }
}

export const paydunyaService = new PaydunyaService();
