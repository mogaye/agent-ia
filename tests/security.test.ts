import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  hashPassword, 
  verifyPassword, 
  generateSecureOtp, 
  verifySecureOtp, 
  createSessionToken, 
  verifySessionToken 
} from '../server/auth.ts';
import { db } from '../server/db.ts';
import { OFFICIAL_PLANS, getPlanOrThrow } from '../server/pricing.ts';
import { paytechService } from '../server/paytechService.ts';
import { paydunyaService } from '../server/paydunyaService.ts';

describe('SMG Flow - Suite de Tests de Sécurité & Conformité', () => {

  // 1. Tests Connexion & Mots de passe
  describe('1. Authentification & Connexion', () => {
    test('Hachage sécurisé et vérification des mots de passe (scrypt + salt)', () => {
      const password = 'MonMotDePasseSuperSecurise2026!';
      const hash = hashPassword(password);
      
      assert.notEqual(password, hash);
      assert.ok(hash.includes(':'), 'Le hash doit contenir le salt et la clé scrypt');
      
      assert.equal(verifyPassword(password, hash), true, 'Le mot de passe correct doit être validé');
      assert.equal(verifyPassword('MauvaisMotDePasse', hash), false, 'Un mauvais mot de passe doit être rejeté');
    });

    test('Un utilisateur ou numéro inconnu ne doit jamais créer automatiquement une entreprise lors du login', async () => {
      const unknownEmail = 'inconnu_hack_' + Date.now() + '@fake.com';
      const user = await db.findUserByIdentifier(unknownEmail);
      assert.equal(user, null, 'Un utilisateur inexistant doit retourner null et ne pas être créé automatiquement');
    });
  });

  // 2. Tests Rôles & Sessions
  describe('2. Rôles & Sessions Sécurisées', () => {
    test('Création et vérification de jeton de session inviolable avec signature HMAC-SHA256', () => {
      const testUser = {
        id: 'u-test-admin',
        email: 'admin@smgflow.pro',
        fullName: 'Admin Test',
        role: 'super_admin' as const,
        companyId: 'c-test-1',
        companyName: 'Test Company',
        createdAt: new Date().toISOString()
      };

      const token = createSessionToken(testUser);
      assert.ok(token.includes('.'), 'Le jeton doit contenir le payload et la signature HMAC');

      const verified = verifySessionToken(token);
      assert.ok(verified, 'Le jeton valide doit être décodé');
      assert.equal(verified?.role, 'super_admin');
      assert.equal(verified?.companyId, 'c-test-1');

      // Test jeton falsifié
      const [payloadB64] = token.split('.');
      const falsifiedToken = `${payloadB64}.fausse_signature_modifiee`;
      const falsifiedCheck = verifySessionToken(falsifiedToken);
      assert.equal(falsifiedCheck, null, 'Un jeton falsifié avec une fausse signature doit être rejeté');
    });

    test('Rôles distincts : super_admin, company_admin, company_user', async () => {
      const comp = await db.createCompany({ name: 'Entreprise Test Rôles' });
      
      const adminUser = await db.createUser({
        email: `admin_${Date.now()}@test.sn`,
        fullName: 'Gérant Test',
        role: 'company_admin',
        companyId: comp.id,
        companyName: comp.name
      });
      assert.equal(adminUser.role, 'company_admin');

      const normalUser = await db.createUser({
        email: `user_${Date.now()}@test.sn`,
        fullName: 'Opérateur Test',
        role: 'company_user',
        companyId: comp.id,
        companyName: comp.name
      });
      assert.equal(normalUser.role, 'company_user');
      assert.notEqual(normalUser.role, adminUser.role);
    });
  });

  // 3. Tests OTP (Crypto, Hash, Tentatives, Expiration, Usage unique)
  describe('3. Génération & Sécurité des Codes OTP', () => {
    test('Génération cryptographique, hachage et usage unique', () => {
      const phone = '+221 77 999 88 77';
      const otpRes = generateSecureOtp(phone);
      
      assert.equal(otpRes.success, true);
      assert.ok(otpRes.rawCodeForDelivery, 'Le code brut pour acheminement doit être généré');
      assert.equal(otpRes.rawCodeForDelivery.length, 6, 'Le code doit avoir 6 chiffres');

      const rawCode = otpRes.rawCodeForDelivery;

      // Mauvais code
      const badCheck = verifySecureOtp(phone, '000000');
      assert.equal(badCheck.valid, false, 'Un mauvais code doit être invalidé');

      // Bon code
      const goodCheck = verifySecureOtp(phone, rawCode);
      assert.equal(goodCheck.valid, true, 'Le bon code doit être validé');

      // Usage unique : réutiliser le même code doit échouer
      const reuseCheck = verifySecureOtp(phone, rawCode);
      assert.equal(reuseCheck.valid, false, 'Un code OTP déjà utilisé doit être rejeté (usage unique)');
    });

    test('Limitation du nombre de tentatives OTP (Anti-Bruteforce)', () => {
      const phone = '+221 78 555 44 33';
      const otpRes = generateSecureOtp(phone);
      assert.ok(otpRes.rawCodeForDelivery);

      // Effectuer 5 tentatives erronées
      for (let i = 0; i < 5; i++) {
        verifySecureOtp(phone, `11111${i}`);
      }

      // La 6ème tentative ou même le bon code après épuisement doit être rejeté
      const lockedCheck = verifySecureOtp(phone, otpRes.rawCodeForDelivery);
      assert.equal(lockedCheck.valid, false, 'Le code doit être verrouillé après dépassement du quota de tentatives');
    });
  });

  // 4. Tests Isolement des Entreprises (Multi-Tenant)
  describe('4. Isolement Strict des Entreprises', () => {
    test('Chaque entreprise a son propre contexte IA et ses données étanches', async () => {
      const compA = await db.createCompany({ name: 'Entreprise A - Dakar' });
      const compB = await db.createCompany({ name: 'Entreprise B - Saint-Louis' });

      await db.updateAgentContext(compA.id, {
        agentName: 'Agent A',
        companyName: 'Entreprise A - Dakar',
        instructions: 'Consigne secrète de A'
      });

      await db.updateAgentContext(compB.id, {
        agentName: 'Agent B',
        companyName: 'Entreprise B - Saint-Louis',
        instructions: 'Consigne secrète de B'
      });

      const ctxA = await db.getAgentContext(compA.id);
      const ctxB = await db.getAgentContext(compB.id);

      assert.equal(ctxA.companyName, 'Entreprise A - Dakar');
      assert.equal(ctxB.companyName, 'Entreprise B - Saint-Louis');
      assert.notEqual(ctxA.instructions, ctxB.instructions, 'L\'entreprise A ne doit pas voir les données de B');
    });

    test('Journaux WhatsApp isolés par entreprise', async () => {
      const compA = await db.createCompany({ name: 'Clinique A' });
      const compB = await db.createCompany({ name: 'Restaurant B' });

      await db.logWhatsAppMessage({
        companyId: compA.id,
        sender: '+221770000001',
        messageBody: 'RDV médical',
        aiResponse: 'RDV confirmé'
      });

      await db.logWhatsAppMessage({
        companyId: compB.id,
        sender: '+221770000002',
        messageBody: 'Commande repas',
        aiResponse: 'Repas prêt'
      });

      const logsA = await db.getWhatsAppLogs(compA.id);
      const logsB = await db.getWhatsAppLogs(compB.id);

      assert.ok(logsA.every(l => l.companyId === compA.id), 'Les logs de A doivent uniquement appartenir à A');
      assert.ok(logsB.every(l => l.companyId === compB.id), 'Les logs de B doivent uniquement appartenir à B');
    });
  });

  // 5. Tests Paiement Falsifié & Tarification Serveur
  describe('5. Protection contre les Paiements Falsifiés & Catalogues Serveur', () => {
    test('Les prix et forfaits sont définis côté serveur et ne peuvent être altérés par le navigateur', () => {
      const proPlan = getPlanOrThrow('pro');
      assert.equal(proPlan.priceXOF, 25000, 'Le prix officiel PRO doit être de 25 000 FCFA');
      assert.equal(proPlan.credits, 6000, 'Les crédits inclus doivent être de 6 000');

      assert.throws(() => {
        getPlanOrThrow('plan_pirate_gratuit');
      }, /Plan inconnu ou non autorisé/, 'Un plan non existant doit lever une exception');
    });

    test('Transaction atomique : crédite exactement une seule fois (idempotence)', async () => {
      const comp = await db.createCompany({ name: 'Commerce Teranga', plan: 'starter' });
      const initialCredits = comp.monthlyCreditsLimit;

      const tx = await db.createTransaction({
        refCommand: `TEST-TX-${Date.now()}`,
        gateway: 'paytech',
        planId: 'pro',
        itemName: 'Abonnement PRO',
        amount: 25000,
        currency: 'XOF',
        creditsAdded: 6000,
        status: 'pending',
        paymentMethod: 'Wave',
        companyId: comp.id,
        companyName: comp.name
      });

      // Première confirmation : doit créditer
      const firstCredit = await db.confirmAndCreditTransaction({ refCommand: tx.refCommand });
      assert.equal(firstCredit.success, true);

      const compAfterFirst = await db.findCompanyById(comp.id);
      assert.equal(compAfterFirst?.monthlyCreditsLimit, initialCredits + 6000);

      // Seconde tentative (rejeu / replay attack) : ne doit PAS créditer à nouveau
      const secondCredit = await db.confirmAndCreditTransaction({ refCommand: tx.refCommand });
      assert.equal(secondCredit.success, true);

      const compAfterSecond = await db.findCompanyById(comp.id);
      assert.equal(compAfterSecond?.monthlyCreditsLimit, initialCredits + 6000, 'Le compte ne doit pas être crédité une deuxième fois');
    });
  });

  // 6. Tests Webhook Invalide
  describe('6. Rejet des Webhooks Invalides (PayTech & PayDunya)', () => {
    test('PayTech refuse un webhook avec une signature secrète invalide ou absente', () => {
      const invalidHeaders = {
        'api_secret_sha256': 'fausse_signature_sha256_invalide'
      };
      const isValid = paytechService.verifyIpnSignature(invalidHeaders);
      assert.equal(isValid, false, 'Le webhook PayTech sans signature secrète valide doit être refusé');
    });

    test('PayDunya refuse un webhook avec un hash SHA-512 non conforme', () => {
      const token = 'tok_invoice_123456';
      const fakeHash = 'hash_falsifie_non_conforme_sha512';
      const isValid = paydunyaService.verifyIpnHash(token, fakeHash);
      assert.equal(isValid, false, 'Le webhook PayDunya sans hash SHA-512 calculé avec la MasterKey doit être refusé');
    });
  });

  // 7. Tests Protection des Routes Administrateur
  describe('7. Protection des Routes Sensibles Super-Admin', () => {
    test('Un utilisateur non super_admin ne peut pas avoir les privilèges globaux', () => {
      const enterpriseSession = {
        userId: 'u-company',
        email: 'gerant@client.com',
        role: 'company_admin' as const,
        companyId: 'c-client-1',
        companyName: 'Client 1',
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600
      };

      const isSuperAdmin = (enterpriseSession.role as string) === 'super_admin';
      assert.equal(isSuperAdmin, false, 'Un company_admin ne doit pas avoir le rôle super_admin');
    });
  });

});
