import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '@/common/utils/envConfig';

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req, res) => ipKeyGenerator(req.ip as string),
});

export default rateLimiter;
