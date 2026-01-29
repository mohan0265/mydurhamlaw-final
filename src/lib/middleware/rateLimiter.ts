// Enhanced Rate Limiter Middleware for Caseway API Protection
import { NextApiRequest, NextApiResponse } from "next";
import { logSecurityEvent } from "@/lib/security/apiSecurity";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    violations: number;
    lastViolation: number;
  };
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  statusCode: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (req: NextApiRequest) => string;
}

// In-memory store (use Redis for production scaling)
const store: RateLimitStore = {};

// Cleanup interval to prevent memory leaks
setInterval(
  () => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      const entry = store[key];
      if (entry && entry.resetTime < now) {
        delete store[key];
      }
    });
  },
  5 * 60 * 1000,
); // Clean up every 5 minutes

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  statusCode?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextApiRequest) => string;
}

const DEFAULT_OPTIONS: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: "Too many requests from this IP, please try again later.",
  statusCode: 429,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req: NextApiRequest) => {
    // Enhanced IP detection
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) ||
      req.headers["x-real-ip"] ||
      req.connection?.remoteAddress ||
      "127.0.0.1";

    // Include user agent for additional uniqueness
    const userAgent = req.headers["user-agent"] || "unknown";
    const userAgentHash = Buffer.from(userAgent)
      .toString("base64")
      .substring(0, 8);

    return `${ip}:${userAgentHash}`;
  },
};

export function createRateLimit(options: RateLimitOptions = {}) {
  const config: RateLimitConfig = { ...DEFAULT_OPTIONS, ...options };

  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    next?: () => void,
  ) => {
    const key = config.keyGenerator(req);
    const now = Date.now();

    // Initialize or get current record
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs,
        violations: store[key]?.violations || 0,
        lastViolation: store[key]?.lastViolation || 0,
      };
    }

    // Increment counter
    store[key].count++;

    // Check if limit exceeded
    if (store[key].count > config.maxRequests) {
      const timeUntilReset = Math.ceil((store[key].resetTime - now) / 1000);

      // Track violations for escalating restrictions
      store[key].violations++;
      store[key].lastViolation = now;

      // Log security event
      logSecurityEvent({
        type: "rate_limit",
        details: {
          key,
          count: store[key].count,
          limit: config.maxRequests,
          violations: store[key].violations,
          endpoint: req.url,
          method: req.method,
        },
        req,
      });

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", config.maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader(
        "X-RateLimit-Reset",
        Math.ceil(store[key].resetTime / 1000),
      );
      res.setHeader("Retry-After", timeUntilReset);

      // Escalating penalties for repeat offenders
      let penaltyMultiplier = 1;
      if (store[key].violations > 5) {
        penaltyMultiplier = 4; // 4x longer wait time
        res.setHeader("X-RateLimit-Penalty", "severe");
      } else if (store[key].violations > 2) {
        penaltyMultiplier = 2; // 2x longer wait time
        res.setHeader("X-RateLimit-Penalty", "moderate");
      }

      return res.status(config.statusCode).json({
        error: config.message,
        retryAfter: timeUntilReset * penaltyMultiplier,
        violations: store[key].violations,
      });
    }

    // Set rate limit headers for successful requests
    const remaining = Math.max(0, config.maxRequests - store[key].count);
    res.setHeader("X-RateLimit-Limit", config.maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(store[key].resetTime / 1000));

    // Continue to next middleware or route handler
    if (next) {
      return next();
    }
  };
}

// Legacy compatibility
export const rateLimit = createRateLimit;

// Pre-configured rate limiters for different Caseway endpoints

// Strict limits for authentication endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Only 5 auth attempts per 15 minutes
  message:
    "Too many authentication attempts. Please try again later for security.",
  statusCode: 429,
});

// Medium limits for AI/GPT endpoints
export const aiRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10, // 10 AI requests per 5 minutes
  message:
    "AI request limit exceeded. Please wait before making more AI requests.",
  statusCode: 429,
});

// Strict limits for voice/audio endpoints
export const voiceRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 20, // 20 voice requests per 10 minutes
  message:
    "Voice processing limit exceeded. Please wait before using voice features again.",
  statusCode: 429,
});

// General API rate limits
export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per minute
  message: "API rate limit exceeded. Please wait before making more requests.",
  statusCode: 429,
});

// Strict limits for signup endpoints
export const signupRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // Only 3 signup attempts per hour
  message: "Too many signup attempts. Please try again later.",
  statusCode: 429,
});

// User-specific rate limiting (requires authentication)
export function createUserRateLimit(
  options: RateLimitOptions & {
    getUserId?: (req: NextApiRequest) => string | null;
  } = {},
) {
  const { getUserId, ...rateLimitOptions } = options;

  return createRateLimit({
    ...rateLimitOptions,
    keyGenerator: (req: NextApiRequest) => {
      const userId = getUserId?.(req);
      if (userId) {
        return `user:${userId}`;
      }
      // Fallback to IP-based limiting
      return DEFAULT_OPTIONS.keyGenerator(req);
    },
  });
}

// Helper function to apply rate limiting to API routes
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options?: RateLimitOptions,
) {
  const limiter = createRateLimit(options);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    return new Promise<void>((resolve, reject) => {
      limiter(req, res, async () => {
        try {
          await handler(req, res);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  };
}

// Rate limiting for specific Caseway features
export const memoryJournalRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 15, // 15 memory entries per 5 minutes
  message:
    "Memory journal rate limit exceeded. Please wait before adding more entries.",
});

export const assignmentGeneratorRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 5, // 5 assignment generations per 10 minutes
  message:
    "Assignment generation limit exceeded. Please wait before generating more content.",
});

export const wellbeingRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 wellbeing interactions per 15 minutes
  message:
    "Wellbeing feature rate limit exceeded. Take a break and try again later.",
});

// Export current rate limit status (for monitoring)
export function getRateLimitStatus(key: string) {
  const record = store[key];
  if (!record) {
    return null;
  }

  const now = Date.now();
  const isExpired = record.resetTime < now;

  return {
    count: isExpired ? 0 : record.count,
    resetTime: record.resetTime,
    violations: record.violations,
    isExpired,
  };
}

// Clear rate limit for a specific key (admin function)
export function clearRateLimit(key: string) {
  delete store[key];
}
