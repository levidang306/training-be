import { extendZodWithOpenApi, ZodRequestBody } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const CreateUserContentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const PostUser: ZodRequestBody = {
  description: 'Create a new user',
  content: {
    'application/json': {
      schema: CreateUserContentSchema,
    },
  },
};

// Input Validation for 'POST users' endpoint
export const PostUserSchema = z.object({
  body: CreateUserContentSchema,
});
