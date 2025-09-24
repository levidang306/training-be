import { NextFunction, Request, Response } from 'express';

import { verifyJwt } from '@/common/utils/jwtUtils';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    [key: string]: any;
  };
}

const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log('🚀 ~ authenticateJWT ~ authHeader:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyJwt(token);

    if (!decoded || typeof decoded !== 'object') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = decoded as { userId: string; [key: string]: any };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authenticateJWT;
