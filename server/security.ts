import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// ==========================================
// 1. ZOD VALIDATION SCHEMAS
// ==========================================

export const loginSchema = z.object({
  identifier: z.string().min(3).max(120).trim(),
  authType: z.enum(['otp', 'password']).default('password'),
  password: z.string().min(6).max(128).optional(),
  code: z.string().length(6).regex(/^\d{6}$/).optional()
});

export const registerSchema = z.object({
  companyName: z.string().min(2).max(100).trim(),
  fullName: z.string().min(2).max(80).trim(),
  email: z.string().email().max(120).trim().toLowerCase(),
  phone: z.string().min(8).max(25).trim(),
  password: z.string().min(8).max(128).optional()
});

export const otpSendSchema = z.object({
  identifier: z.string().min(5).max(120).trim(),
  type: z.enum(['email', 'whatsapp']).default('whatsapp')
});

export const otpVerifySchema = z.object({
  identifier: z.string().min(5).max(120).trim(),
  code: z.string().length(6).regex(/^\d{6}$/, "Le code doit comporter exactement 6 chiffres.")
});

export const agentContextUpdateSchema = z.object({
  companyId: z.string().max(64).optional(),
  agentId: z.string().max(64).optional(),
  companyName: z.string().min(1).max(120).optional(),
  agentName: z.string().min(1).max(60).optional(),
  roleType: z.string().max(60).optional(),
  roleTitle: z.string().max(100).optional(),
  welcomeMessage: z.string().max(2000).optional(),
  industry: z.string().max(100).optional(),
  services: z.array(z.string().max(200)).max(30).optional(),
  documentsContext: z.string().max(250000, "La base de connaissances ne doit pas dépasser 250 000 caractères.").optional(),
  knowledgeBase: z.string().max(250000, "La base de connaissances ne doit pas dépasser 250 000 caractères.").optional(),
  instructions: z.string().max(60000, "Les instructions ne doivent pas dépasser 60 000 caractères.").optional(),
  customInstructions: z.string().max(60000, "Les instructions ne doivent pas dépasser 60 000 caractères.").optional(),
  documents: z.array(z.any()).optional(),
  strictRules: z.union([z.array(z.string().max(500)).max(50), z.string().max(15000)]).optional(),
  openingHours: z.string().max(200).optional(),
  address: z.string().max(250).optional(),
  pricingRules: z.string().max(5000).optional(),
  personalContactPhone: z.string().max(40).optional(),
  personalContactName: z.string().max(80).optional(),
  responseLatencySeconds: z.number().min(0).max(60).optional(),
  products: z.array(z.any()).optional(),
  orders: z.array(z.any()).optional(),
  reservations: z.array(z.any()).optional(),
  calendarSlots: z.array(z.any()).optional(),
  invoices: z.array(z.any()).optional(),
  customers: z.array(z.any()).optional(),
  instructionsList: z.array(z.any()).optional(),
  modules: z.array(z.any()).optional(),
  agentsList: z.array(z.any()).optional()
});

export const aiChatSchema = z.object({
  message: z.string().min(1).max(4000, "Le message ne peut pas dépasser 4000 caractères.").trim(),
  companyId: z.string().max(64).optional(),
  sender: z.string().max(80).optional(),
  agentId: z.string().max(64).optional(),
  agentName: z.string().max(80).optional(),
  roleType: z.string().max(50).optional(),
  instructions: z.string().max(60000).optional(),
  knowledgeText: z.string().max(250000).optional()
});

export const paymentRequestSchema = z.object({
  planId: z.enum(['starter', 'pro', 'business', 'enterprise_125k', 'credits_pack_20k']),
  paymentMethod: z.enum(['Wave', 'Orange Money', 'Carte Bancaire', 'Free Money', 'PayTech']).default('Wave'),
  clientName: z.string().min(2).max(100).trim(),
  clientPhone: z.string().min(6).max(25).trim(),
  companyId: z.string().max(64).optional(),
  companyName: z.string().max(120).optional()
});

export const paytechIpnSchema = z.object({
  ref_command: z.string().optional(),
  item_price: z.union([z.number(), z.string()]).optional(),
  currency: z.string().optional(),
  custom_field: z.string().optional(),
  token: z.string().optional(),
  type_event: z.string().optional()
});

export const latencySchema = z.object({
  seconds: z.number().min(0).max(60)
});

export const optOutSchema = z.object({
  phoneNumber: z.string().min(6).max(30).trim(),
  companyId: z.string().max(64).optional(),
  reason: z.string().max(200).optional()
});

// Helper for validating request body
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides : ' + parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
      });
    }
    req.body = parsed.data;
    next();
  };
}

// ==========================================
// 2. RATE LIMITERS
// ==========================================

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: 'Trop de tentatives d\'authentification. Veuillez réessayer dans 15 minutes.'
  }
});

export const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: 'Trop de demandes de code OTP. Veuillez patienter avant d\'en redemander un.'
  }
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: 'Trop de tentatives de validation de code. Veuillez patienter 10 minutes.'
  }
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: 'Limite de requêtes IA atteinte pour cette minute.'
  }
});

export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    success: false,
    error: 'Limite d\'initialisation de paiement atteinte. Veuillez patienter.'
  }
});

export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false
});

// ==========================================
// 3. SECURITY HEADERS & CORS
// ==========================================

export const securityHeadersMiddleware = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    originAgentCluster: false,
    xFrameOptions: false
  }),
  (req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    next();
  }
];

export const configureCors = () => {
  const allowedOrigins = [
    'https://smgflow.pro',
    'https://www.smgflow.pro',
    process.env.APP_URL || ''
  ].filter(Boolean);

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or localhost in dev
      if (!origin) return callback(null, true);
      
      const isAllowed = 
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.includes('.run.app') ||
        origin.includes('google') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Origine non autorisée par la politique CORS de SMG Flow.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'api_key_sha256', 'api_secret_sha256']
  });
};
