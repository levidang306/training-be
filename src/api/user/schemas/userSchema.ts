import { extendZodWithOpenApi, ZodRequestBody } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { commonValidations } from '@/common/utils/commonValidation';

extendZodWithOpenApi(z);

export type User = z.infer<typeof UserSchema>;
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string(),
  name: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  projectMembers: z.array(commonValidations.id).optional(),
  cardMembers: z.array(commonValidations.id).optional(),
  comments: z.array(commonValidations.id).optional(),
  notifications: z.array(commonValidations.id).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const PostList: ZodRequestBody = {
  description: 'Update profile',
  content: {
    'application/json': {
      schema: UpdateProfileSchema,
    },
  },
};

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
  params: z.object({ id: z.string().uuid('ID must be a valid UUID') }),
});

export const UpdateUserSchema = z.object({
  params: z.object({ id: z.string().uuid('ID must be a valid UUID') }),
  body: UpdateProfileSchema,
});
