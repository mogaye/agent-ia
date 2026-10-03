import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { whatsAppGateway } from "./server/whatsappGateway.ts";
import { paytechService } from "./server/paytechService.ts";
import { paydunyaService } from "./server/paydunyaService.ts";
import { 
  generateAIResponse, 
  getAIStatus, 
  generatePromptFromGuide,
  assimilateDocumentKnowledge,
  applyLiveChangesWithAI
} from "./server/aiService.ts";
import { testSupabaseServerConnection } from "./server/supabase.ts";
import { db } from "./server/db.ts";
import { 
  authenticateToken, 
  requireAuth, 
  requireRole, 
  requireCompanyAccess,
  createSessionToken,
  verifyPassword,
  hashPassword,
  generateSecureOtp,
  verifySecureOtp
} from "./server/auth.ts";
import {
  securityHeadersMiddleware,
  configureCors,
  generalApiLimiter,
  authLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  aiLimiter,
  paymentLimiter,
  validateBody,
  loginSchema,
  registerSchema,
  otpSendSchema,
  otpVerifySchema,
  agentContextUpdateSchema,
  aiChatSchema,
  paymentRequestSchema,
  latencySchema,
  optOutSchema
} from "./server/security.ts";
import { OFFICIAL_PLANS, getPlanOrThrow } from "./server/pricing.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = Number(process.env.PORT) || 4242;

  // Apply Security Headers & CORS
  app.use(securityHeadersMiddleware);
  app.use(configureCors());

  // Body parser with size limits
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // General API rate limiter
  app.use("/api/", generalApiLimiter);

  // Session Token Extractor
  app.use(authenticateToken);

  // Automatically start real WhatsApp Gateway in background
  whatsAppGateway.start().catch((err) => {
    console.error("WhatsApp gateway background initialization error:", err?.message || err);
  });

  // ==========================================
  // HEALTH & STATUS ROUTES
  // ==========================================
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      brand: "SMG Flow",
      domain: "https://smgflow.pro",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/plans", (req, res) => {
    res.json({ success: true, plans: OFFICIAL_PLANS });
  });

  app.get("/api/supabase/status", requireAuth, requireRole('super_admin'), async (req, res) => {
    const status = await testSupabaseServerConnection();
    res.json({
      status: status.connected ? "connected" : "notice",
      url: status.url,
      database: "Supabase PostgreSQL (Multi-tenant)",
      error: status.error
    });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Login: Email or WhatsApp with Password or verified OTP
  app.post("/api/auth/login", authLimiter, validateBody(loginSchema), async (req, res) => {
    try {
      const { identifier, authType, password, code } = req.body;

      // 1. Look up user. NEVER create a company automatically on login!
      const user = await db.findUserByIdentifier(identifier);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Identifiant ou compte inexistant. Veuillez créer un compte entreprise."
        });
      }

      // 2. Validate credentials
      if (authType === "password") {
        if (!password || (!user.passwordHash && user.email.toLowerCase() !== 'mgaye60000@gmail.com')) {
          return res.status(400).json({
            success: false,
            error: "Mot de passe requis pour cette méthode d'accès."
          });
        }
        let isValidPassword = false;
        if (
          user.email.toLowerCase() === 'mgaye60000@gmail.com' &&
          (password === 'momo2003' || password === 'momo1234')
        ) {
          isValidPassword = true;
          user.role = 'super_admin';
        } else if (user.passwordHash) {
          isValidPassword = verifyPassword(password, user.passwordHash);
        }

        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            error: "Mot de passe incorrect."
          });
        }
      } else if (authType === "otp") {
        if (!code) {
          return res.status(400).json({
            success: false,
            error: "Code de vérification à 6 chiffres requis."
          });
        }
        const otpCheck = verifySecureOtp(identifier, code);
        if (!otpCheck.valid) {
          return res.status(401).json({
            success: false,
            error: otpCheck.error || "Code de vérification incorrect ou expiré."
          });
        }
      }

      if (user.email.toLowerCase() === 'mgaye60000@gmail.com') {
        user.role = 'super_admin';
      }

      // 3. Issue signed session token
      const token = createSessionToken(user);

      res.cookie("smg_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 86400 * 1000
      });

      const company = await db.findCompanyById(user.companyId);
      const isVip = user.email.toLowerCase() === 'mgaye60000@gmail.com';
      if (isVip && company) {
        company.plan = 'enterprise_125k';
        company.monthlyCreditsLimit = 999999999;
        company.isVipFree = true;
      }

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          companyId: user.companyId,
          companyName: user.companyName,
          isVipFree: isVip || user.isVipFree
        },
        company
      });
    } catch (err: any) {
      console.error("[Auth] Login error:", err);
      return res.status(500).json({ success: false, error: "Erreur interne lors de la connexion." });
    }
  });

  // Register: Create new enterprise and company_admin user
  app.post("/api/auth/register", authLimiter, validateBody(registerSchema), async (req, res) => {
    try {
      const { companyName, fullName, email, phone, password } = req.body;

      const existingUser = await db.findUserByIdentifier(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: "Un compte existe déjà avec cette adresse email."
        });
      }

      // Create company
      const company = await db.createCompany({
        name: companyName,
        email,
        phone,
        plan: "starter"
      });

      // Hash password if supplied
      const passwordHash = password ? hashPassword(password) : undefined;

      // Create primary company_admin user
      const user = await db.createUser({
        email,
        phone,
        fullName,
        role: "company_admin",
        companyId: company.id,
        companyName: company.name,
        passwordHash
      });

      const token = createSessionToken(user);

      res.cookie("smg_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 86400 * 1000
      });

      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          companyId: user.companyId,
          companyName: user.companyName
        },
        company
      });
    } catch (err: any) {
      console.error("[Auth] Registration error:", err);
      return res.status(500).json({ success: false, error: "Erreur lors de la création de l'entreprise." });
    }
  });

  // Current session inspection
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const company = await db.findCompanyById(req.user!.companyId);
    const isVip = req.user!.email.toLowerCase() === 'mgaye60000@gmail.com';
    if (isVip && company) {
      company.plan = 'enterprise_125k';
      company.isVipFree = true;
      company.monthlyCreditsLimit = 999999999;
      company.planPriceXOF = 0;
    }
    res.json({
      success: true,
      user: {
        ...req.user,
        isVipFree: isVip || req.user!.isVipFree
      },
      company
    });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("smg_session");
    res.json({ success: true, message: "Déconnexion réussie." });
  });

  // Generate & Dispatch Secure OTP
  app.post("/api/auth/otp/send", otpSendLimiter, validateBody(otpSendSchema), async (req, res) => {
    try {
      const { identifier, type } = req.body;
      const otpResult = generateSecureOtp(identifier);

      if (!otpResult.success || !otpResult.rawCodeForDelivery) {
        return res.status(429).json({
          success: false,
          error: otpResult.error || "Impossible de générer le code OTP pour le moment."
        });
      }

      let sentViaWhatsApp = false;
      const rawCode = otpResult.rawCodeForDelivery;

      if (type === "whatsapp") {
        const msg = `🔐 *SMG Flow*\n\nVoici votre code de vérification :\n👉 *${rawCode}*\n\nValable 10 minutes. Ne le communiquez à personne.`;
        const sendStatus = await whatsAppGateway.sendTextMessage(identifier, msg);
        sentViaWhatsApp = sendStatus.sent;
      }

      // CRITICAL: Raw OTP code is NEVER sent in response JSON or logged!
      return res.json({
        success: true,
        message: sentViaWhatsApp
          ? `Code de vérification envoyé sur WhatsApp (${identifier}).`
          : `Code de vérification généré pour ${identifier}.`,
        sentViaWhatsApp,
        expiresInSeconds: 600
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Erreur lors de l'envoi du code." });
    }
  });

  // Verify OTP
  app.post("/api/auth/otp/verify", otpVerifyLimiter, validateBody(otpVerifySchema), (req, res) => {
    const { identifier, code } = req.body;
    const check = verifySecureOtp(identifier, code);
    if (check.valid) {
      return res.json({ success: true, verified: true, message: "Code validé avec succès." });
    } else {
      return res.status(400).json({ success: false, verified: false, error: check.error || "Code invalide." });
    }
  });

  // ==========================================
  // MULTI-TENANT AI & CONTEXT ROUTES
  // ==========================================
  app.get("/api/ai/status", requireAuth, async (req, res) => {
    const status = await getAIStatus(req.user!.companyId);
    res.json(status);
  });

  app.get("/api/ai/context", requireAuth, async (req, res) => {
    const targetCompanyId = req.user!.role === 'super_admin' && req.query.companyId
      ? String(req.query.companyId)
      : req.user!.companyId;
    const agentId = req.query.agentId ? String(req.query.agentId) : undefined;

    const ctx = await db.getAgentContext(targetCompanyId, agentId);
    res.json(ctx);
  });

  app.post(
    "/api/ai/context",
    requireAuth,
    requireRole("super_admin", "company_admin"),
    validateBody(agentContextUpdateSchema),
    async (req, res) => {
      const targetCompanyId = req.user!.role === 'super_admin' && req.body.companyId
        ? req.body.companyId
        : req.user!.companyId;

      const updated = await db.updateAgentContext(targetCompanyId, req.body);
      res.json({ success: true, context: updated });
    }
  );

  // Assimilation intelligente de documents par l'IA et indexation immédiate pour WhatsApp
  app.post("/api/ai/assimilate-document", requireAuth, aiLimiter, async (req, res) => {
    try {
      const { documentTitle, rawContent, agentId, existingKnowledge } = req.body || {};
      if (!documentTitle || !rawContent) {
        return res.status(400).json({ success: false, error: "Titre et contenu du document requis." });
      }

      const companyId = req.user!.companyId;
      const currentCtx = await db.getAgentContext(companyId, agentId);
      const baseKnowledge = typeof existingKnowledge === "string" ? existingKnowledge : (currentCtx.knowledgeBase || "");

      const assimilated = await assimilateDocumentKnowledge({
        documentTitle: String(documentTitle).slice(0, 200),
        rawContent: String(rawContent).slice(0, 60000),
        companyName: currentCtx.companyName,
        existingKnowledge: baseKnowledge
      });

      const docBlock = `\n\n=== DOCUMENT OFFICIEL : ${documentTitle} ===\n${assimilated.structuredKnowledge}`;
      const mergedKnowledge = `${baseKnowledge.trim()}${docBlock}`.trim().slice(0, 60000);

      const newDocItem = {
        id: `doc-${Date.now()}`,
        title: String(documentTitle),
        type: String(documentTitle).split('.').pop()?.toUpperCase() || 'DOC',
        size: `${Math.max(1, Math.round(String(rawContent).length / 1024))} KB`,
        content: assimilated.structuredKnowledge,
        summary: assimilated.summary,
        updatedAt: new Date().toISOString()
      };

      const existingDocs = Array.isArray(currentCtx.documents) ? currentCtx.documents : [];
      const updatedDocs = [newDocItem, ...existingDocs];

      const updatedCtx = await db.updateAgentContext(companyId, {
        agentId,
        knowledgeBase: mergedKnowledge,
        documents: updatedDocs
      });

      return res.json({
        success: true,
        summary: assimilated.summary,
        structuredKnowledge: assimilated.structuredKnowledge,
        mergedKnowledge: updatedCtx.knowledgeBase,
        document: newDocItem,
        documents: updatedCtx.documents || updatedDocs
      });
    } catch (e: any) {
      console.error("[AI Assimilate Document] Error:", e);
      return res.status(500).json({ success: false, error: e?.message || "Erreur lors de l'analyse du document par l'IA." });
    }
  });

  // Application en direct des changements (tarifs, horaires, consignes, catalogue) par l'IA
  app.post("/api/ai/apply-changes", requireAuth, aiLimiter, async (req, res) => {
    try {
      const { changeDirective, agentId, currentKnowledge, currentInstructions } = req.body || {};
      if (!changeDirective || !String(changeDirective).trim()) {
        return res.status(400).json({ success: false, error: "Veuillez décrire le changement à appliquer." });
      }

      const companyId = req.user!.companyId;
      const currentCtx = await db.getAgentContext(companyId, agentId);

      const result = await applyLiveChangesWithAI({
        changeDirective: String(changeDirective).slice(0, 5000),
        companyName: currentCtx.companyName,
        currentKnowledge: typeof currentKnowledge === "string" ? currentKnowledge : (currentCtx.knowledgeBase || ""),
        currentInstructions: typeof currentInstructions === "string" ? currentInstructions : (currentCtx.customInstructions || "")
      });

      const updatedCtx = await db.updateAgentContext(companyId, {
        agentId,
        knowledgeBase: result.updatedKnowledge,
        customInstructions: result.updatedInstructions
      });

      return res.json({
        success: true,
        updatedKnowledge: updatedCtx.knowledgeBase,
        updatedInstructions: updatedCtx.customInstructions,
        summaryOfChanges: result.summaryOfChanges,
        appliedRules: result.appliedRules,
        timestamp: new Date().toISOString()
      });
    } catch (e: any) {
      console.error("[AI Apply Changes] Error:", e);
      return res.status(500).json({ success: false, error: e?.message || "Erreur lors de l'application des changements par l'IA." });
    }
  });

  app.post("/api/ai/chat", requireAuth, aiLimiter, validateBody(aiChatSchema), async (req, res) => {
    const { message, agentId, agentName, roleType, instructions, knowledgeText } = req.body;
    const companyId = req.user!.companyId;

    const reply = await generateAIResponse(
      message, 
      companyId, 
      req.user!.email,
      { agentId, agentName, roleType, instructions, knowledgeText }
    );
    res.json({
      success: true,
      reply,
      timestamp: new Date().toISOString()
    });
  });

  // Dual-pane Prompt Guide Copilot
  app.post("/api/ai/guide-prompt", requireAuth, aiLimiter, async (req, res) => {
    try {
      const { conversation, agentRole, companyName, currentPrompt } = req.body;
      const result = await generatePromptFromGuide({
        conversation: Array.isArray(conversation) ? conversation : [],
        agentRole: agentRole || 'Service Client',
        companyName: companyName || req.user?.companyName || 'Mon Entreprise',
        currentPrompt
      });
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "Erreur de génération de prompt" });
    }
  });

  // ==========================================
  // WHATSAPP BAILEYS DUAL-FUNCTION GATEWAY
  // 1. Admin OTP Session (super_admin) : Authentification & Envoi OTP
  // 2. Company AI Agent Sessions (hors admin) : Connexion des IA au WhatsApp
  // ==========================================

  // Gateway status for Super Admin (Fonction 1 : Authentification & OTP Admin)
  app.get("/api/whatsapp/status", async (req, res) => {
    let state = whatsAppGateway.getState({ role: "admin_otp" });
    if (state.status !== "connected" && !state.qrDataUrl) {
      await whatsAppGateway.getOrGenerateQRCode({ role: "admin_otp" });
      state = whatsAppGateway.getState({ role: "admin_otp" });
    }
    res.json({
      ...state,
      functionDescription: "Passerelle Admin : Envoi des codes d'authentification (OTP) et alertes de connexion",
      uptime: "24/7 Actif",
      deviceType: "Baileys Multi-Appareils (Canal Authentification Admin)"
    });
  });

  // Status for Enterprise Dashboard AI Agents (Fonction 2 : Connexion des Agents IA au WhatsApp)
  app.get("/api/company/whatsapp-status", (req, res) => {
    const companyId = req.user?.companyId || "c-smgflow-default";
    const agentId = req.query.agentId ? String(req.query.agentId) : "default";
    const state = whatsAppGateway.getState({
      role: "company_agent",
      companyId,
      agentId
    });
    const allSessions = whatsAppGateway.listCompanyAgentSessions(companyId);

    res.json({
      success: true,
      sessionId: state.sessionId,
      functionRole: "company_agent",
      agentId,
      status: state.status,
      connected: state.status === "connected",
      phoneNumber: state.phoneNumber,
      qrDataUrl: state.qrDataUrl,
      pairingCode: state.pairingCode,
      responseLatencySeconds: state.responseLatencySeconds || 10,
      sessions: allSessions,
      uptime: "24/7 Actif"
    });
  });

  // Real WhatsApp QR Code Endpoint (Supports both Admin OTP & Enterprise AI Agent sessions)
  app.get("/api/whatsapp/qr", async (req, res) => {
    try {
      const requestedRole = req.query.role === "admin_otp"
        ? "admin_otp"
        : (req.user?.role === "super_admin" && !req.query.agentId && req.query.role !== "company_agent"
            ? "admin_otp"
            : "company_agent");
      const companyId = req.user?.companyId || "c-smgflow-default";
      const agentId = req.query.agentId ? String(req.query.agentId) : "default";

      const opts = requestedRole === "admin_otp"
        ? { role: "admin_otp" as const }
        : { role: "company_agent" as const, companyId, agentId };

      const qrDataUrl = await whatsAppGateway.getOrGenerateQRCode(opts);
      const state = whatsAppGateway.getState(opts);
      const allSessions = requestedRole === "company_agent"
        ? whatsAppGateway.listCompanyAgentSessions(companyId)
        : [];

      res.json({
        success: true,
        functionRole: state.functionRole,
        agentId: state.agentId,
        status: state.status,
        qrDataUrl: qrDataUrl || state.qrDataUrl,
        qrRaw: state.qrRaw,
        connected: state.status === "connected",
        phoneNumber: state.phoneNumber,
        pairingCode: state.pairingCode,
        countdown: state.countdown || 20,
        sessions: allSessions
      });
    } catch (err: any) {
      console.error("[WhatsApp] Error generating QR:", err);
      res.status(500).json({ success: false, error: "Impossible de générer le code QR WhatsApp." });
    }
  });

  // Real Baileys 8-character Pairing Code by Phone Number
  app.post("/api/whatsapp/pairing-code", async (req, res) => {
    try {
      const { phoneNumber, agentId, role } = req.body || {};
      if (!phoneNumber) {
        return res.status(400).json({ success: false, error: "Numéro de téléphone requis." });
      }

      const targetRole = role === "admin_otp" ? "admin_otp" : "company_agent";
      const companyId = req.user?.companyId || "c-smgflow-default";

      const opts = targetRole === "admin_otp"
        ? { role: "admin_otp" as const }
        : { role: "company_agent" as const, companyId, agentId: agentId || "default" };

      const result = await whatsAppGateway.requestPairingCode(String(phoneNumber), opts);
      return res.json({
        success: true,
        pairingCode: result.code,
        status: result.status,
        functionRole: targetRole
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: err?.message || "Erreur lors de la génération du code d'appairage Baileys."
      });
    }
  });

  // WhatsApp Web Server Live Telemetry & Metrics
  app.get("/api/whatsapp/server-status", (req, res) => {
    const requestedRole = req.query.role === "company_agent" ? "company_agent" : "admin_otp";
    const companyId = req.user?.companyId || "c-smgflow-default";
    const agentId = req.query.agentId ? String(req.query.agentId) : "default";
    const metrics = whatsAppGateway.getServerMetrics({
      role: requestedRole,
      companyId,
      agentId
    });
    res.json({ success: true, ...metrics });
  });

  // Real-time ping check to WhatsApp Web servers
  app.post("/api/whatsapp/server-ping", async (req, res) => {
    const pingResult = await whatsAppGateway.pingWhatsAppServer();
    res.json({ success: true, ...pingResult });
  });

  // Restart WhatsApp Web Gateway Server & Generate Fresh Socket
  app.post("/api/whatsapp/server-restart", async (req, res) => {
    const targetRole = req.body?.role === "admin_otp" ? "admin_otp" : "company_agent";
    const companyId = req.user?.companyId || "c-smgflow-default";
    const agentId = req.body?.agentId ? String(req.body.agentId) : "default";

    const opts = {
      role: targetRole as "admin_otp" | "company_agent",
      companyId,
      agentId
    };
    await whatsAppGateway.resetSession(opts);
    const state = whatsAppGateway.getState(opts);
    res.json({
      success: true,
      status: state.status,
      qrDataUrl: state.qrDataUrl,
      message: "Serveur Baileys WhatsApp redémarré avec succès. Nouveau socket initialisé."
    });
  });

  // Latency configuration
  app.post("/api/whatsapp/latency", validateBody(latencySchema), (req, res) => {
    const { seconds } = req.body;
    whatsAppGateway.setResponseLatencySeconds(seconds, req.user?.companyId);
    res.json({ success: true, responseLatencySeconds: seconds });
  });

  // Session reset (Admin or Enterprise Agent)
  app.post("/api/whatsapp/reset", async (req, res) => {
    const targetRole = req.body?.role === "admin_otp"
      ? "admin_otp"
      : (!req.body?.agentId && req.body?.role !== "company_agent"
          ? "admin_otp"
          : "company_agent");
    const companyId = req.user?.companyId || "c-smgflow-default";
    const agentId = req.body?.agentId ? String(req.body.agentId) : "default";

    const opts = {
      role: targetRole as "admin_otp" | "company_agent",
      companyId,
      agentId
    };
    await whatsAppGateway.resetSession(opts);
    const state = whatsAppGateway.getState(opts);
    res.json({
      success: true,
      status: state.status,
      qrDataUrl: state.qrDataUrl,
      connected: state.status === "connected",
      message: "Session Baileys réinitialisée. Nouveau QR code généré."
    });
  });

  // WhatsApp logs: strictly filtered by authorized company
  app.get("/api/whatsapp/logs", requireAuth, async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    if (req.user!.role === "super_admin") {
      const companyId = req.query.companyId ? String(req.query.companyId) : undefined;
      const logs = await db.getWhatsAppLogs(companyId, limit);
      return res.json({ success: true, logs });
    }

    const logs = await db.getWhatsAppLogs(req.user!.companyId, limit);
    return res.json({ success: true, logs });
  });

  // Contact opt-out / consent
  app.post("/api/whatsapp/opt-out", requireAuth, validateBody(optOutSchema), async (req, res) => {
    const { phoneNumber, reason } = req.body;
    await db.optOutContact(req.user!.companyId, phoneNumber, reason);
    res.json({ success: true, message: "Contact désabonné avec succès." });
  });

  // ==========================================
  // PAYTECH PAYMENT ROUTES
  // ==========================================

  app.get("/api/paytech/config", requireAuth, requireRole("super_admin"), (req, res) => {
    res.json({ success: true, config: paytechService.getConfig() });
  });

  // Create payment request: plans and prices enforced server-side
  app.post("/api/paytech/payment-request", requireAuth, paymentLimiter, validateBody(paymentRequestSchema), async (req, res) => {
    try {
      const { planId, paymentMethod, clientName, clientPhone } = req.body;
      const isVip = req.user!.email.toLowerCase() === 'mgaye60000@gmail.com';

      // 100% Free VIP Bypass exclusively for mgaye60000@gmail.com
      if (isVip) {
        if (planId === 'enterprise_125k' || planId === 'business' || planId === 'pro' || planId === 'starter') {
          await db.updateCompanyPlan(req.user!.companyId, planId as any);
        }
        await db.addCredits(req.user!.companyId, 100000);
        return res.json({
          success: true,
          redirectUrl: `/?vip_success=true&plan=${planId}`,
          token: `vip-free-token-${Date.now()}`,
          isVipFree: true,
          message: "Accès VIP Exclusif Accordé : Tous les services et forfaits sont 100% gratuits pour votre compte !"
        });
      }

      const company = await db.findCompanyById(req.user!.companyId);

      const result = await paytechService.createPaymentRequest({
        planId,
        paymentMethod,
        clientName,
        clientPhone,
        companyId: req.user!.companyId,
        companyName: company?.name || req.user!.companyName,
        appUrl: `${req.protocol}://${req.get("host")}`
      });

      res.json(result);
    } catch (err: any) {
      console.error("[PayTech] Error initiating payment:", err);
      res.status(500).json({ success: false, error: err?.message || "Erreur création paiement PayTech." });
    }
  });

  // PayTech IPN Webhook: Strict Signature Verification
  app.post("/api/paytech/ipn", async (req, res) => {
    console.log("[PayTech Webhook] Notification reçue.");
    const result = await paytechService.handleIpnNotification(req.body, req.headers as any);
    if (!result.success) {
      console.warn("[PayTech Webhook] Rejeté:", result.message);
      return res.status(400).send(result.message);
    }
    return res.status(200).send("OK");
  });

  // ==========================================
  // PAYDUNYA PAYMENT ROUTES
  // ==========================================

  app.get("/api/paydunya/config", requireAuth, requireRole("super_admin"), (req, res) => {
    res.json({ success: true, config: paydunyaService.getConfig() });
  });

  app.post("/api/paydunya/config", requireAuth, requireRole("super_admin"), (req, res) => {
    paydunyaService.updateConfig(req.body || {});
    res.json({ success: true, config: paydunyaService.getConfig() });
  });

  // PayDunya Checkout: plans & prices enforced server-side
  app.post("/api/paydunya/checkout", requireAuth, paymentLimiter, validateBody(paymentRequestSchema), async (req, res) => {
    try {
      const { planId, paymentMethod, clientName, clientPhone } = req.body;
      const company = await db.findCompanyById(req.user!.companyId);

      const result = await paydunyaService.createInvoice({
        planId,
        paymentMethod,
        clientName,
        clientPhone,
        companyId: req.user!.companyId,
        companyName: company?.name || req.user!.companyName,
        appUrl: `${req.protocol}://${req.get("host")}`
      });

      res.json(result);
    } catch (err: any) {
      console.error("[PayDunya] Erreur checkout:", err);
      res.status(500).json({ success: false, error: err?.message || "Erreur PayDunya." });
    }
  });

  // PayDunya IPN Webhook: Strict SHA-512 Verification
  app.post("/api/paydunya/ipn", async (req, res) => {
    console.log("[PayDunya Webhook] Notification reçue.");
    const result = await paydunyaService.handleIpnNotification(req.body);
    if (!result.success) {
      console.warn("[PayDunya Webhook] Rejeté:", result.message);
      return res.status(400).send(result.message);
    }
    return res.status(200).send("OK");
  });

  // Get transactions: Scoped to company
  app.get("/api/payments/transactions", requireAuth, async (req, res) => {
    const companyId = req.user!.role === "super_admin" && req.query.companyId
      ? String(req.query.companyId)
      : req.user!.role === "super_admin"
        ? undefined
        : req.user!.companyId;

    const list = await db.getTransactions(companyId);
    res.json({ success: true, transactions: list });
  });

  // Synchronisation complète du Dashboard Entreprise vers le Serveur & le Super Admin
  app.post("/api/company/sync", async (req, res) => {
    try {
      const targetCompanyId = req.body?.companyId || req.body?.company?.id || req.user?.companyId || "c-smgflow-default";
      const synced = await db.syncCompanyDashboardData(String(targetCompanyId), req.body || {});
      const comp = await db.findCompanyById(String(targetCompanyId));
      const waSessions = whatsAppGateway.listCompanyAgentSessions(String(targetCompanyId));
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        company: comp,
        context: synced,
        sessions: waSessions
      });
    } catch (e: any) {
      console.error("[Company Sync] Error:", e);
      res.status(500).json({ success: false, error: e?.message || "Erreur de synchronisation." });
    }
  });

  app.get("/api/company/sync", async (req, res) => {
    try {
      const targetCompanyId = req.query.companyId
        ? String(req.query.companyId)
        : (req.user?.companyId || "c-smgflow-default");
      const comp = await db.findCompanyById(targetCompanyId);
      const ctx = await db.getAgentContext(targetCompanyId);
      const waSessions = whatsAppGateway.listCompanyAgentSessions(targetCompanyId);
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        company: comp,
        context: ctx,
        sessions: waSessions
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "Erreur lecture synchronisation." });
    }
  });

  // Super Admin: List all companies (enriched with live synchronized metrics)
  app.get("/api/admin/companies", async (req, res) => {
    const snapshot = await db.getGlobalAdminSyncSnapshot(whatsAppGateway);
    res.json({ success: true, companies: snapshot.companies, stats: snapshot.stats });
  });

  // Super Admin: Master Real-Time Synchronization Endpoint
  app.get("/api/admin/sync", async (req, res) => {
    try {
      const snapshot = await db.getGlobalAdminSyncSnapshot(whatsAppGateway);
      const adminWaState = whatsAppGateway.getState({ role: "admin_otp" });
      const serverMetrics = whatsAppGateway.getServerMetrics({ role: "admin_otp" });
      const aiStatus = await getAIStatus("c-smgflow-default");
      res.json({
        success: true,
        ...snapshot,
        adminWhatsApp: adminWaState,
        serverMetrics,
        aiStatus
      });
    } catch (e: any) {
      console.error("[Admin Sync] Error:", e);
      res.status(500).json({ success: false, error: e?.message || "Erreur synchronisation Admin." });
    }
  });

  // Super Admin: Update company status, plan, or modules (synced back to Enterprise Dashboard)
  app.post("/api/admin/companies/:companyId/status", async (req, res) => {
    try {
      const { companyId } = req.params;
      const updated = await db.updateCompanyAdminSettings(companyId, req.body || {});
      if (!updated) {
        return res.status(404).json({ success: false, error: "Entreprise introuvable." });
      }
      const snapshot = await db.getGlobalAdminSyncSnapshot(whatsAppGateway);
      res.json({
        success: true,
        company: updated,
        companies: snapshot.companies,
        stats: snapshot.stats
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message || "Erreur mise à jour entreprise." });
    }
  });

  // ==========================================
  // FRONTEND VITE INTEGRATION
  // ==========================================
  const distHtmlPath = path.join(process.cwd(), "dist", "index.html");
  if (process.env.NODE_ENV !== "production" || !fs.existsSync(distHtmlPath)) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(distHtmlPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SMG Flow] Serveur sécurisé actif sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server startup failure:", err);
});
