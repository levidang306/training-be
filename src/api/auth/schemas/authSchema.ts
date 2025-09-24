import { extendZodWithOpenApi, ZodRequestBody } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export type Token = z.infer<typeof TokenSchema>;
export const TokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.union([z.string(), z.number()]),
  tokenType: z.string(),
});

export type Login = z.infer<typeof LoginSchema>;
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const PostLogin: ZodRequestBody = {
  description: 'Create a new user',
  content: {
    'application/json': {
      schema: LoginSchema,
    },
  },
};

// Input Validation for 'POST users' endpoint
export const PostVerifyEmailSchema = z.object({
  query: z.object({ token: z.string() }),
});

// Input Validation for 'POST users' endpoint
export const PostLoginSchema = z.object({
  body: LoginSchema,
});
