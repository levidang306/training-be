import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    [key: string]: any;
  };
}

export default AuthenticatedRequest;
