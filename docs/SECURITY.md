# 🛡️ Security Guide

## 🌟 Overview

This guide covers comprehensive security practices for the Task Management Backend, including authentication, authorization, data protection, and security monitoring.

## 🔐 Authentication & Authorization

### JWT Token Security

#### Token Configuration

```typescript
// JWT Configuration
const JWT_CONFIG = {
  algorithm: 'HS256' as const,
  expiresIn: '15m', // Short-lived access tokens
  refreshExpiresIn: '7d', // Longer-lived refresh tokens
  issuer: 'task-management-api',
  audience: 'task-management-client',
};

// Token generation with secure claims
export const generateTokens = (user: User) => {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    jti: uuidv4(), // Unique token ID for revocation
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: JWT_CONFIG.expiresIn,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });

  const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: JWT_CONFIG.refreshExpiresIn,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });

  return { accessToken, refreshToken };
};
```

#### Token Validation Middleware

```typescript
// Enhanced authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        responseObject: null,
        statusCode: 401,
      });
    }

    const token = authHeader.substring(7);

    // Check token blacklist
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        responseObject: null,
        statusCode: 401,
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }) as JwtPayload;

    // Additional security checks
    if (payload.type === 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type',
        responseObject: null,
        statusCode: 401,
      });
    }

    // Fetch current user data
    const user = await UserRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        responseObject: null,
        statusCode: 401,
      });
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    logger.warn('Authentication failed', { error: error.message });

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      responseObject: null,
      statusCode: 401,
    });
  }
};
```

### Role-Based Access Control (RBAC)

#### Permission System

```typescript
// Permission definitions
export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',

  // Project permissions
  PROJECT_CREATE = 'project:create',
  PROJECT_READ = 'project:read',
  PROJECT_WRITE = 'project:write',
  PROJECT_DELETE = 'project:delete',
  PROJECT_MANAGE_MEMBERS = 'project:manage_members',

  // Board permissions
  BOARD_CREATE = 'board:create',
  BOARD_READ = 'board:read',
  BOARD_WRITE = 'board:write',
  BOARD_DELETE = 'board:delete',

  // Card permissions
  CARD_CREATE = 'card:create',
  CARD_READ = 'card:read',
  CARD_WRITE = 'card:write',
  CARD_DELETE = 'card:delete',
  CARD_ASSIGN = 'card:assign',

  // Comment permissions
  COMMENT_CREATE = 'comment:create',
  COMMENT_READ = 'comment:read',
  COMMENT_WRITE = 'comment:write',
  COMMENT_DELETE = 'comment:delete',

  // Admin permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_PROJECTS = 'admin:projects',
  ADMIN_SYSTEM = 'admin:system',
}

// Role definitions
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PROJECT_MANAGER = 'project_manager',
  MEMBER = 'member',
  GUEST = 'guest',
}

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),

  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_MANAGE_MEMBERS,
    Permission.BOARD_CREATE,
    Permission.BOARD_READ,
    Permission.BOARD_WRITE,
    Permission.BOARD_DELETE,
    Permission.CARD_CREATE,
    Permission.CARD_READ,
    Permission.CARD_WRITE,
    Permission.CARD_DELETE,
    Permission.CARD_ASSIGN,
    Permission.COMMENT_CREATE,
    Permission.COMMENT_READ,
    Permission.COMMENT_WRITE,
    Permission.COMMENT_DELETE,
    Permission.ADMIN_PROJECTS,
  ],

  [Role.PROJECT_MANAGER]: [
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_WRITE,
    Permission.PROJECT_MANAGE_MEMBERS,
    Permission.BOARD_CREATE,
    Permission.BOARD_READ,
    Permission.BOARD_WRITE,
    Permission.CARD_CREATE,
    Permission.CARD_READ,
    Permission.CARD_WRITE,
    Permission.CARD_ASSIGN,
    Permission.COMMENT_CREATE,
    Permission.COMMENT_READ,
    Permission.COMMENT_WRITE,
  ],

  [Role.MEMBER]: [
    Permission.USER_READ,
    Permission.PROJECT_READ,
    Permission.BOARD_READ,
    Permission.CARD_CREATE,
    Permission.CARD_READ,
    Permission.CARD_WRITE,
    Permission.COMMENT_CREATE,
    Permission.COMMENT_READ,
    Permission.COMMENT_WRITE,
  ],

  [Role.GUEST]: [Permission.PROJECT_READ, Permission.BOARD_READ, Permission.CARD_READ, Permission.COMMENT_READ],
};
```

#### Authorization Middleware

```typescript
// Permission-based authorization
export const authorize = (requiredPermission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          responseObject: null,
          statusCode: 401,
        });
      }

      // Check if user has required permission
      const userPermissions = ROLE_PERMISSIONS[user.role] || [];
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          responseObject: null,
          statusCode: 403,
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization error', { error: error.message, user: req.user });
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        responseObject: null,
        statusCode: 500,
      });
    }
  };
};

// Resource-based authorization
export const authorizeResource = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const resourceId = req.params.id;

      // Check if user has access to specific resource
      const hasAccess = await checkResourceAccess(user.id, resourceType, resourceId);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this resource',
          responseObject: null,
          statusCode: 403,
        });
      }

      next();
    } catch (error) {
      logger.error('Resource authorization error', {
        error: error.message,
        user: req.user,
        resourceId: req.params.id,
      });
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        responseObject: null,
        statusCode: 500,
      });
    }
  };
};
```

## 🔒 Password Security

### Password Hashing

```typescript
import bcrypt from 'bcryptjs';
import { promisify } from 'util';

// Use higher cost factor for better security
const BCRYPT_ROUNDS = 12;

export class PasswordService {
  static async hash(password: string): Promise<string> {
    // Validate password strength before hashing
    this.validatePasswordStrength(password);

    return await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  static validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    if (password.length < minLength) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!hasUpperCase) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!hasLowerCase) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!hasNumbers) {
      throw new Error('Password must contain at least one number');
    }

    if (!hasNonalphas) {
      throw new Error('Password must contain at least one special character');
    }

    // Check against common passwords
    if (this.isCommonPassword(password)) {
      throw new Error('Password is too common, please choose a different one');
    }
  }

  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  // Generate secure random password
  static generateSecurePassword(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }
}
```

### Password Reset Security

```typescript
export class PasswordResetService {
  // Generate secure reset token
  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Store reset token with expiration
  static async createResetToken(userId: string): Promise<string> {
    const token = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await PasswordResetToken.create({
      userId,
      token: await bcrypt.hash(token, 10), // Hash the token
      expiresAt,
      used: false,
    });

    return token; // Return unhashed token for email
  }

  // Validate reset token
  static async validateResetToken(token: string): Promise<string | null> {
    const resetTokens = await PasswordResetToken.find({
      where: {
        used: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    // Check each token (constant time to prevent timing attacks)
    for (const tokenRecord of resetTokens) {
      const isValid = await bcrypt.compare(token, tokenRecord.token);
      if (isValid) {
        return tokenRecord.userId;
      }
    }

    return null;
  }

  // Mark token as used
  static async markTokenAsUsed(token: string): Promise<void> {
    const resetTokens = await PasswordResetToken.find({
      where: { used: false },
    });

    for (const tokenRecord of resetTokens) {
      const isMatch = await bcrypt.compare(token, tokenRecord.token);
      if (isMatch) {
        tokenRecord.used = true;
        await tokenRecord.save();
        break;
      }
    }
  }
}
```

## 🛡️ Input Validation & Sanitization

### Validation Schemas

```typescript
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// User validation schemas
export const userValidation = {
  register: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .min(1, 'Email is required')
      .max(255, 'Email too long')
      .transform((email) => email.toLowerCase().trim()),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),

    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in first name')
      .transform((name) => DOMPurify.sanitize(name.trim())),

    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in last name')
      .transform((name) => DOMPurify.sanitize(name.trim())),
  }),

  login: z.object({
    email: z
      .string()
      .email('Invalid email format')
      .transform((email) => email.toLowerCase().trim()),
    password: z.string().min(1, 'Password is required'),
  }),

  updateProfile: z.object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in first name')
      .transform((name) => DOMPurify.sanitize(name.trim()))
      .optional(),

    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in last name')
      .transform((name) => DOMPurify.sanitize(name.trim()))
      .optional(),

    bio: z
      .string()
      .max(500, 'Bio too long')
      .transform((bio) => DOMPurify.sanitize(bio.trim()))
      .optional(),
  }),
};

// Project validation schemas
export const projectValidation = {
  create: z.object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .max(100, 'Project name too long')
      .transform((name) => DOMPurify.sanitize(name.trim())),

    description: z
      .string()
      .max(1000, 'Description too long')
      .transform((desc) => DOMPurify.sanitize(desc.trim()))
      .optional(),

    isPublic: z.boolean().default(false),

    tags: z.array(z.string().max(20)).max(10).optional(),
  }),

  update: z.object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .max(100, 'Project name too long')
      .transform((name) => DOMPurify.sanitize(name.trim()))
      .optional(),

    description: z
      .string()
      .max(1000, 'Description too long')
      .transform((desc) => DOMPurify.sanitize(desc.trim()))
      .optional(),

    isPublic: z.boolean().optional(),

    tags: z.array(z.string().max(20)).max(10).optional(),
  }),
};
```

### Validation Middleware

```typescript
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          responseObject: { errors },
          statusCode: 400,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Validation error',
        responseObject: null,
        statusCode: 500,
      });
    }
  };
};

// SQL Injection Prevention
export const sanitizeQuery = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /[';\"\\]/g,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  ];

  const checkSuspiciousContent = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some((pattern) => pattern.test(obj));
    }

    if (Array.isArray(obj)) {
      return obj.some((item) => checkSuspiciousContent(item));
    }

    if (obj && typeof obj === 'object') {
      return Object.values(obj).some((value) => checkSuspiciousContent(value));
    }

    return false;
  };

  if (checkSuspiciousContent(req.body) || checkSuspiciousContent(req.query) || checkSuspiciousContent(req.params)) {
    logger.warn('Suspicious input detected', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      params: req.params,
    });

    return res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      responseObject: null,
      statusCode: 400,
    });
  }

  next();
};
```

## 🔐 Data Encryption

### Sensitive Data Encryption

```typescript
import crypto from 'crypto';

export class EncryptionService {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;
  private static readonly ivLength = 16;
  private static readonly tagLength = 16;

  // Encrypt sensitive data
  static encrypt(text: string, key?: string): string {
    const encryptionKey = key
      ? crypto.createHash('sha256').update(key).digest()
      : crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY!).digest();

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine iv, tag, and encrypted data
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  static decrypt(encryptedData: string, key?: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const encryptionKey = key
      ? crypto.createHash('sha256').update(key).digest()
      : crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY!).digest();

    const decipher = crypto.createDecipher(this.algorithm, encryptionKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Hash sensitive data (one-way)
  static hash(data: string, salt?: string): string {
    const hashSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, hashSalt, 10000, 64, 'sha256');
    return hashSalt + ':' + hash.toString('hex');
  }

  // Verify hashed data
  static verifyHash(data: string, hashedData: string): boolean {
    const [salt, hash] = hashedData.split(':');
    const dataHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha256');
    return hash === dataHash.toString('hex');
  }
}
```

## 🚫 Rate Limiting & DDoS Protection

### Advanced Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Global rate limiter
export const globalRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    responseObject: null,
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
});

// Auth-specific rate limiter (stricter)
export const authRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    responseObject: null,
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to include user ID
  keyGenerator: (req) => {
    return req.ip + ':' + (req.body?.email || 'unknown');
  },
});

// API-specific rate limiter
export const apiRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: {
    success: false,
    message: 'API rate limit exceeded',
    responseObject: null,
    statusCode: 429,
  },
});

// Advanced rate limiting with user tiers
export const tieredRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  let maxRequests = 100; // Default for unauthenticated users

  if (user) {
    switch (user.role) {
      case Role.SUPER_ADMIN:
      case Role.ADMIN:
        maxRequests = 10000;
        break;
      case Role.PROJECT_MANAGER:
        maxRequests = 1000;
        break;
      case Role.MEMBER:
        maxRequests = 500;
        break;
      case Role.GUEST:
        maxRequests = 100;
        break;
    }
  }

  const limiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs: 60 * 60 * 1000, // 1 hour
    max: maxRequests,
    keyGenerator: (req) => (user ? `user:${user.id}` : req.ip),
    message: {
      success: false,
      message: 'Rate limit exceeded for your user tier',
      responseObject: null,
      statusCode: 429,
    },
  });

  limiter(req, res, next);
};
```

## 🔍 Security Monitoring & Logging

### Security Event Logging

```typescript
import winston from 'winston';

// Security-specific logger
export const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'security' },
  transports: [
    new winston.transports.File({
      filename: 'logs/security.log',
      level: 'warn',
    }),
    new winston.transports.File({
      filename: 'logs/security-error.log',
      level: 'error',
    }),
  ],
});

// Security event types
export enum SecurityEvent {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_LOCKED = 'auth_locked',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  ADMIN_ACTION = 'admin_action',
}

// Log security events
export const logSecurityEvent = (
  event: SecurityEvent,
  details: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    resource?: string;
    action?: string;
    success: boolean;
    reason?: string;
    metadata?: Record<string, any>;
  }
) => {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (details.success) {
    securityLogger.info('Security event', logData);
  } else {
    securityLogger.warn('Security violation', logData);
  }

  // Check for security alerts
  checkSecurityAlerts(event, details);
};

// Security alert system
const checkSecurityAlerts = (event: SecurityEvent, details: any) => {
  // Multiple failed login attempts
  if (event === SecurityEvent.AUTH_FAILURE) {
    checkFailedLoginAttempts(details.ip, details.userId);
  }

  // Suspicious activity patterns
  if (event === SecurityEvent.SUSPICIOUS_ACTIVITY) {
    alertSecurityTeam(event, details);
  }

  // Permission escalation attempts
  if (event === SecurityEvent.PERMISSION_DENIED) {
    checkPermissionEscalation(details.userId, details.resource);
  }
};

// Check for brute force attacks
const checkFailedLoginAttempts = async (ip: string, userId?: string) => {
  const key = `failed_login:${ip}:${userId || 'unknown'}`;
  const attempts = await redis.incr(key);
  await redis.expire(key, 900); // 15 minutes

  if (attempts >= 5) {
    // Lock account or IP
    await lockAccount(ip, userId);

    // Alert security team
    alertSecurityTeam(SecurityEvent.AUTH_LOCKED, {
      ip,
      userId,
      attempts,
      reason: 'Multiple failed login attempts',
    });
  }
};

// Account locking mechanism
const lockAccount = async (ip: string, userId?: string) => {
  const lockKey = `locked:${ip}:${userId || 'unknown'}`;
  await redis.setex(lockKey, 1800, 'locked'); // 30 minutes

  if (userId) {
    // Update user record
    await UserRepository.updateUser(userId, { isLocked: true });
  }
};
```

### Intrusion Detection

```typescript
// Intrusion detection middleware
export const intrusionDetection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,

    // XSS patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,

    // Path traversal
    /\.\.[\/\\]/g,
    /\.(php|asp|jsp|py|rb|pl)$/gi,

    // Command injection
    /[;&|`$(){}[\]]/g,

    // Headers injection
    /[\r\n]/g,
  ];

  const checkContent = (content: string): boolean => {
    return suspiciousPatterns.some((pattern) => pattern.test(content));
  };

  // Check all input sources
  const allInputs = [
    JSON.stringify(req.body),
    JSON.stringify(req.query),
    JSON.stringify(req.params),
    req.get('User-Agent') || '',
    req.get('Referer') || '',
  ].join(' ');

  if (checkContent(allInputs)) {
    logSecurityEvent(SecurityEvent.SUSPICIOUS_ACTIVITY, {
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      resource: req.path,
      action: req.method,
      success: false,
      reason: 'Suspicious input patterns detected',
      metadata: {
        body: req.body,
        query: req.query,
        params: req.params,
      },
    });

    return res.status(400).json({
      success: false,
      message: 'Invalid request',
      responseObject: null,
      statusCode: 400,
    });
  }

  next();
};
```

## 🌐 CORS & HTTP Security Headers

### Security Headers Middleware

```typescript
import helmet from 'helmet';

export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'wss:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Permissions Policy
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      camera: ["'none'"],
      microphone: ["'none'"],
      usb: ["'none'"],
      fullscreen: ["'self'"],
    },
  },
});

// CORS configuration
export const corsOptions = {
  origin: (origin: string, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
};
```

## 🔐 Environment Security

### Environment Configuration

```bash
# .env.example - Security Configuration
NODE_ENV=production

# Database Security
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=app_user
DB_PASSWORD=super_secure_password_here
DB_DATABASE=task_management
DB_SSL=true

# JWT Security
JWT_SECRET=very_long_random_string_for_jwt_signing
JWT_REFRESH_SECRET=another_very_long_random_string_for_refresh_tokens
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=32_character_encryption_key_here

# Rate Limiting
REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Security
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=no-reply@yourdomain.com
SMTP_PASS=secure_email_password

# API Security
API_KEY_HEADER=X-API-Key
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Security Headers
HSTS_MAX_AGE=31536000
CSP_REPORT_URI=https://yourdomain.com/csp-report

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=warn
```

### Environment Validation

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),

  // Database
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(8),
  DB_DATABASE: z.string().min(1),
  DB_SSL: z.string().transform((val) => val === 'true'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),

  // Redis
  REDIS_URL: z.string().url(),

  // Email
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1),

  // Security
  ALLOWED_ORIGINS: z.string().min(1),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
};
```

## 🚨 Security Checklist

### Development Security

- [ ] All dependencies are up to date and scanned for vulnerabilities
- [ ] Environment variables are properly configured and validated
- [ ] Secrets are not committed to version control
- [ ] Code is linted with security rules (ESLint security plugin)
- [ ] All user inputs are validated and sanitized
- [ ] SQL queries use parameterized statements
- [ ] Error messages don't expose sensitive information

### Authentication & Authorization

- [ ] Strong password requirements are enforced
- [ ] JWT tokens have appropriate expiration times
- [ ] Refresh token rotation is implemented
- [ ] Account lockout mechanisms are in place
- [ ] Multi-factor authentication is available (if required)
- [ ] Role-based access control is properly implemented
- [ ] Session management is secure

### Data Protection

- [ ] Sensitive data is encrypted at rest
- [ ] Data is encrypted in transit (HTTPS/TLS)
- [ ] Database connections are secured
- [ ] PII is properly handled and anonymized
- [ ] Data retention policies are implemented
- [ ] Backup data is encrypted

### API Security

- [ ] Rate limiting is implemented
- [ ] CORS is properly configured
- [ ] Security headers are set
- [ ] API versioning is implemented
- [ ] Input validation covers all endpoints
- [ ] Output encoding prevents XSS
- [ ] API documentation doesn't expose sensitive information

### Infrastructure Security

- [ ] Docker containers run as non-root user
- [ ] Container images are scanned for vulnerabilities
- [ ] Kubernetes security policies are applied
- [ ] Network policies restrict traffic
- [ ] Secrets are managed with proper tools
- [ ] Monitoring and alerting are configured

### Monitoring & Incident Response

- [ ] Security events are logged
- [ ] Failed authentication attempts are monitored
- [ ] Anomaly detection is configured
- [ ] Incident response plan is documented
- [ ] Security team contact information is available
- [ ] Regular security audits are scheduled

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [TypeORM Security Guidelines](https://typeorm.io/security)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Kubernetes Security](https://kubernetes.io/docs/concepts/security/)
