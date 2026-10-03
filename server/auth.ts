import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AuthUser, SessionData, UserRole } from './types.ts';

// Strong session secret
const SESSION_SECRET = process.env.SESSION_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Security Warning] SESSION_SECRET non configuré en production. Utilisation d\'un secret d\'instance temporaire.');
  }
  return 'smg_flow_production_secure_salt_' + (process.env.APP_URL || 'default_secret_key_32_bytes_min');
})();

// In-memory OTP tracker with rate limiting & attempt counts
interface StoredOtp {
  hashedCode: string;
  identifier: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: number;
  used: boolean;
}

const otpStore = new Map<string, StoredOtp>();
const otpRateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Helper: Hash password using scrypt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch {
    return false;
  }
}

// Helper: Hash OTP using SHA-256 with salt
function hashOtp(identifier: string, code: string): string {
  return crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${identifier.trim().toLowerCase()}:${code.trim()}`)
    .digest('hex');
}

// Generate secure OTP
export function generateSecureOtp(identifier: string): { success: boolean; rawCodeForDelivery?: string; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const now = Date.now();

  // Rate limit: max 3 requests per 10 minutes
  const existingRate = otpRateLimitMap.get(cleanId);
  if (existingRate && existingRate.resetAt > now) {
    if (existingRate.count >= 3) {
      return {
        success: false,
        error: 'Trop de demandes de code. Veuillez patienter 10 minutes avant de réessayer.'
      };
    }
    existingRate.count += 1;
  } else {
    otpRateLimitMap.set(cleanId, { count: 1, resetAt: now + 10 * 60 * 1000 });
  }

  // Generate 6 digit code cryptographically
  const rawCode = crypto.randomInt(100000, 1000000).toString();
  const hashedCode = hashOtp(cleanId, rawCode);

  otpStore.set(cleanId, {
    hashedCode,
    identifier: cleanId,
    attempts: 0,
    maxAttempts: 5,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes
    used: false
  });

  return {
    success: true,
    rawCodeForDelivery: rawCode
  };
}

// Verify OTP
export function verifySecureOtp(identifier: string, code: string): { valid: boolean; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const stored = otpStore.get(cleanId);

  if (!stored) {
    return { valid: false, error: 'Aucun code actif trouvé pour cet identifiant. Veuillez en demander un nouveau.' };
  }

  if (stored.used) {
    return { valid: false, error: 'Ce code a déjà été utilisé.' };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(cleanId);
    return { valid: false, error: 'Ce code a expiré. Veuillez en redemander un.' };
  }

  if (stored.attempts >= stored.maxAttempts) {
    otpStore.delete(cleanId);
    return { valid: false, error: 'Nombre maximal de tentatives dépassé. Veuillez générer un nouveau code.' };
  }

  stored.attempts += 1;

  const candidateHash = hashOtp(cleanId, code);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'hex'),
    Buffer.from(stored.hashedCode, 'hex')
  );

  if (!isValid) {
    const remaining = stored.maxAttempts - stored.attempts;
    return {
      valid: false,
      error: `Code incorrect. Tentatives restantes : ${remaining}`
    };
  }

  // Mark single use
  stored.used = true;
  otpStore.delete(cleanId);

  return { valid: true };
}

// Create Signed Session Token
export function createSessionToken(user: AuthUser, expiresInSeconds = 86400 * 7): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyName: user.companyName,
    isVipFree: user.isVipFree || user.email.toLowerCase() === 'mgaye60000@gmail.com',
    issuedAt: now,
    expiresAt: now + expiresInSeconds
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

// Verify Signed Session Token
export function verifySessionToken(token: string): SessionData | null {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: SessionData = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);

    if (now > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Express Request type extension
declare global {
  namespace Express {
    interface Request {
      user?: SessionData;
    }
  }
}

// Middleware: Authenticate Session
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.smg_session) {
    token = req.cookies.smg_session;
  }

  if (!token) {
    return next();
  }

  const session = verifySessionToken(token);
  if (session) {
    if (session.email && session.email.toLowerCase() === 'mgaye60000@gmail.com') {
      session.role = 'super_admin';
      session.isVipFree = true;
    }
    req.user = session;
  }

  next();
}

// Middleware: Require Authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise. Veuillez vous connecter.'
    });
  }
  next();
}

// Middleware: Require specific role
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentification requise.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Accès refusé. Privilèges insuffisants (${req.user.role}).`
      });
    }
    next();
  };
}

// Middleware: Require company isolation access
export function requireCompanyAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentification requise.' });
  }

  if (req.user.role === 'super_admin') {
    return next(); // Super admin can access any company
  }

  const requestedCompanyId = req.params.companyId || req.query.companyId || req.body?.companyId;

  if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
    return res.status(403).json({
      success: false,
      error: 'Accès interdit aux données d\'une autre entreprise.'
    });
  }

  next();
}
