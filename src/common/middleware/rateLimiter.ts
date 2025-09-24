import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => ipKeyGenerator(req.ip as string),
});

export default rateLimiter;
