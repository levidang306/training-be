import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { Request, Response, Router } from 'express';
import { z } from 'zod';

import { PostUser, PostUserSchema } from '@/api/user/schemas/';
import { GetUserSchema, UserSchema } from '@/api/user/schemas/';
import { userService } from '@/api/user/userService';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { handleServiceResponse, validateRequest } from '@/common/utils/httpHandlers';
import authenticateJWT from '@/common/middleware/authentication';
import AuthenticatedRequest from '@/common/declare/authenticationRequest.declare';

export const userRegistry = new OpenAPIRegistry();

userRegistry.register('User', UserSchema);
userRegistry.register('PostUser', PostUserSchema);

const router = express.Router();

// Registering OpenAPI paths
const registerPaths = () => {
  userRegistry.registerPath({
    method: 'post',
    path: '/users',
    tags: ['User'],
    request: { body: PostUser },
    responses: createApiResponse(UserSchema, 'Success'),
  });

  userRegistry.registerPath({
    method: 'get',
    path: '/users',
    tags: ['User'],
    responses: createApiResponse(z.array(UserSchema), 'Success'),
  });

  userRegistry.registerPath({
    method: 'get',
    path: '/users/{id}',
    tags: ['User'],
    request: { params: GetUserSchema.shape.params },
    responses: createApiResponse(UserSchema, 'Success'),
  });

  userRegistry.registerPath({
    method: 'get',
    path: '/users/me',
    tags: ['User'],
    security: [{ bearerAuth: [] }],
    responses: createApiResponse(UserSchema, 'Success'),
  });
};

// Route to create a new user
router.post('/', validateRequest(PostUserSchema), async (req: Request, res: Response) => {
  const userData = req.body;
  console.log('🚀 ~ userData:', userData);

  const serviceResponse = await userService.create(userData);
  handleServiceResponse(serviceResponse, res);
});

// Route to get all users
router.get('/', async (_req: Request, res: Response) => {
  const serviceResponse = await userService.findAll();
  handleServiceResponse(serviceResponse, res);
});
// Route to get current user profile
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  console.log('🚀 ~ userId:', userId);
  const serviceResponse = await userService.findById(userId);
  handleServiceResponse(serviceResponse, res);
});
// Route to get a user by id
router.get('/:id', validateRequest(GetUserSchema), async (req: Request, res: Response) => {
  const id = req.params.id;
  const serviceResponse = await userService.findById(id);
  handleServiceResponse(serviceResponse, res);
});

registerPaths();

export const userRouter: Router = router;
