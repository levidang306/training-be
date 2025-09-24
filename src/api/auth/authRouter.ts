import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { z } from 'zod';

import { PostUser, PostUserSchema } from '@/api/user/schemas/createUserSchema';
import { UserSchema } from '@/api/user/schemas/userSchema';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { handleServiceResponse, validateRequest } from '@/common/utils/httpHandlers';

import { authService } from './authService';
import { Login, PostLogin, PostLoginSchema, PostVerifyEmailSchema, TokenSchema } from './schemas/authSchema';

export const authRegistry = new OpenAPIRegistry();

authRegistry.register('Token', TokenSchema);
authRegistry.register('PostLogin', PostLoginSchema);

const router = express.Router();

// Registering OpenAPI paths
const registerPaths = () => {
  authRegistry.registerPath({
    method: 'post',
    path: '/auth/register',
    tags: ['Auth'],
    request: { body: PostUser },
    responses: createApiResponse(UserSchema, 'Success'),
  });

  authRegistry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    request: { body: PostLogin },
    responses: createApiResponse(TokenSchema, 'Success'),
  });

  authRegistry.registerPath({
    method: 'post',
    path: '/auth/verify-email?token={token}',
    tags: ['Auth'],
    request: { query: PostVerifyEmailSchema.shape.query },
    responses: createApiResponse(z.boolean(), 'Success', 201),
  });
};

// Route to create a new user
router.post('/register', validateRequest(PostUserSchema), async (req: Request, res: Response) => {
  const userData = req.body;
  const serviceResponse = await authService.register(userData);
  handleServiceResponse(serviceResponse, res);
});

// Route to verify email
router.post('/verify-email', validateRequest(PostVerifyEmailSchema), async (req: Request, res: Response) => {
  const token = req.query.token as string;
  const serviceResponse = await authService.verifyEmail(token);
  handleServiceResponse(serviceResponse, res);
});

// Route to login
router.post('/login', validateRequest(PostLoginSchema), async (req: Request, res: Response) => {
  const userData = req.body as Login;
  const serviceResponse = await authService.login(userData);
  handleServiceResponse(serviceResponse, res);
});

registerPaths();

export const authRouter: Router = router;
