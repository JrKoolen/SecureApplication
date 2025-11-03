import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import Redis from 'redis';

let redisClient: Redis.RedisClientType | null = null;

if (process.env.REDIS_HOST) {
  redisClient = Redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
  });

  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  redisClient.on('connect', () => console.log('✅ Redis connected'));
  
  redisClient.connect().catch(console.error);
}

// Store for rate limiting when Redis is not available
const memoryStore: Map<string, { count: number; resetTime: number }> = new Map();

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0] 
    : req.socket.remoteAddress;
  return ip || 'unknown';
};

export const getRateLimitInfo = async (identifier: string): Promise<{ count: number; resetTime: number }> => {
  if (redisClient) {
    const count = await redisClient.get(`ratelimit:${identifier}`);
    const ttl = await redisClient.ttl(`ratelimit:${identifier}`);
    return {
      count: count ? parseInt(count) : 0,
      resetTime: Date.now() + (ttl > 0 ? ttl * 1000 : 0)
    };
  } else {
    const stored = memoryStore.get(identifier);
    if (stored && stored.resetTime > Date.now()) {
      return stored;
    }
    return { count: 0, resetTime: 0 };
  }
};

export const incrementRateLimit = async (identifier: string, windowMs: number): Promise<number> => {
  if (redisClient) {
    const count = await redisClient.incr(`ratelimit:${identifier}`);
    if (count === 1) {
      await redisClient.expire(`ratelimit:${identifier}`, Math.floor(windowMs / 1000));
    }
    return count;
  } else {
    const stored = memoryStore.get(identifier);
    if (stored && stored.resetTime > Date.now()) {
      stored.count++;
      return stored.count;
    } else {
      memoryStore.set(identifier, { count: 1, resetTime: Date.now() + windowMs });
      return 1;
    }
  }
};

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  skip: (req: Request) => {
    // Skip rate limiting for admin endpoints
    return req.path.startsWith('/api/admin');
  }
});

// Login rate limiter
export const loginRateLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'),
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req)
});

// Account lock checking middleware
export const checkAccountLock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email } = req.body;
  
  if (!email) {
    next();
    return;
  }
  
  // This will be implemented with the auth routes
  next();
};
