# 🛠️ Development Guide

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher (preferred package manager)
- **Docker**: Latest version
- **PostgreSQL**: v15 or higher (for local development)
- **Git**: Latest version

### Installation

```bash
# Clone the repository
git clone https://github.com/levidang306/training-be.git
cd training-be

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Setup database (if running locally)
# Update .env with your database credentials
```

## 🔧 Environment Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
HOST=localhost
PORT=8080

# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=task_management_dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
COMMON_RATE_LIMIT_WINDOW_MS=900000
COMMON_RATE_LIMIT_MAX_REQUESTS=100

# SMTP Configuration (for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for email templates)
FRONTEND_URL=http://localhost:3000
```

### Environment Files

- `.env` - Local development
- `.env.test` - Test environment
- `.env.production` - Production (use Kubernetes secrets instead)

## 🏗️ Project Structure

```
src/
├── api/                          # API routes and handlers
│   ├── auth/                     # Authentication routes
│   │   ├── authRouter.ts         # Auth route definitions
│   │   ├── authService.ts        # Auth business logic
│   │   └── authSchema.ts         # Auth validation schemas
│   ├── user/                     # User management
│   │   ├── userRouter.ts         # User route definitions
│   │   ├── userService.ts        # User business logic
│   │   ├── userRepository.ts     # User data access
│   │   └── userModel.ts          # User entity model
│   └── healthCheck/              # Health check endpoint
├── api-docs/                     # OpenAPI documentation
│   ├── openAPIRouter.ts          # Swagger UI setup
│   └── openAPIDocumentGenerator.ts
├── common/                       # Shared utilities
│   ├── entities/                 # TypeORM entities
│   │   ├── base/                 # Base entity classes
│   │   ├── user.entity.ts        # User entity
│   │   ├── project.entity.ts     # Project entity
│   │   └── ...
│   ├── middleware/               # Express middleware
│   │   ├── errorHandler.ts       # Global error handler
│   │   ├── rateLimiter.ts        # Rate limiting
│   │   └── requestLogger.ts      # Request logging
│   ├── migrations/               # Database migrations
│   ├── models/                   # Response models
│   └── utils/                    # Utility functions
├── configs/                      # Configuration files
│   └── typeorm.config.ts         # Database configuration
├── index.ts                      # Application entry point
└── server.ts                     # Express server setup
```

## 🔨 Development Scripts

### Available Commands

```bash
# Development
pnpm run dev              # Start development server with hot reload
pnpm run dev:debug        # Start with debugging enabled

# Building
pnpm run build            # Build production bundle
pnpm run clean            # Clean build artifacts

# Testing
pnpm run test             # Run tests once
pnpm run test:dev         # Run tests in watch mode
pnpm run test:cov         # Run tests with coverage
pnpm run test:ci          # Run tests for CI

# Code Quality
pnpm run lint             # Run ESLint
pnpm run lint:fix         # Fix ESLint issues
pnpm run format           # Format code with Prettier
pnpm run format:check     # Check code formatting
pnpm run type-check       # TypeScript type checking

# Database
pnpm run typeorm          # TypeORM CLI
pnpm run typeorm:run-migrations       # Run migrations
pnpm run typeorm:generate-migration   # Generate migration
pnpm run typeorm:revert-migration     # Revert last migration

# Docker
pnpm run docker:build     # Build Docker image
pnpm run docker:run       # Run Docker container

# Kubernetes
pnpm run k8s:deploy       # Deploy to Kubernetes
pnpm run k8s:delete       # Delete from Kubernetes
```

## 🧪 Testing

### Test Structure

```
src/
├── api/
│   ├── auth/
│   │   └── __tests__/
│   │       ├── authService.test.ts
│   │       └── authRouter.test.ts
│   └── user/
│       └── __tests__/
│           ├── userService.test.ts
│           └── userRouter.test.ts
└── common/
    └── __tests__/
        ├── errorHandler.test.ts
        └── requestLogger.test.ts
```

### Writing Tests

#### Service Tests Example

```typescript
// authService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../authService';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockUserRepository);
  });

  it('should register user successfully', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    // Act
    const result = await authService.register(userData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.responseObject.user.email).toBe(userData.email);
  });
});
```

#### Router Tests Example

```typescript
// authRouter.test.ts
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '../../server';

describe('Auth Router', () => {
  it('POST /auth/register should create user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    const response = await request(app).post('/auth/register').send(userData).expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.responseObject.user.email).toBe(userData.email);
  });
});
```

### Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});
```

## 🗄️ Database Development

### TypeORM Setup

The application uses TypeORM with PostgreSQL:

```typescript
// typeorm.config.ts
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, Project, Board, List, Card /* ... */],
  migrations: ['src/common/migrations/**/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
});
```

### Entity Example

```typescript
// user.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { DateTimeEntity } from './base/dateTimeEntity';
import { Project } from './project.entity';

@Entity('users')
export class User extends DateTimeEntity {
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @OneToMany(() => Project, (project) => project.owner)
  projects!: Project[];
}
```

### Migrations

#### Generate Migration

```bash
# After modifying entities
pnpm run typeorm:generate-migration -- AddUserTable
```

#### Create Empty Migration

```bash
pnpm run typeorm:create-migration -- AddIndexes
```

#### Run Migrations

```bash
pnpm run typeorm:run-migrations
```

#### Revert Migration

```bash
pnpm run typeorm:revert-migration
```

### Repository Pattern

```typescript
// userRepository.ts
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AppDataSource } from '../configs/typeorm.config';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, userData);
    return this.repository.findOne({ where: { id } });
  }
}
```

## 🔐 Authentication & Authorization

### JWT Implementation

```typescript
// jwtUtils.ts
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
};
```

### Authentication Middleware

```typescript
// authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtUtils';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        responseObject: null,
        statusCode: 401,
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      responseObject: null,
      statusCode: 401,
    });
  }
};
```

## 🔍 Debugging

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Node.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeArgs": ["-r", "tsx/cjs"],
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--no-coverage"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Logging

The application uses Pino for structured logging:

```typescript
// logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
});
```

### Error Handling

Global error handler:

```typescript
// errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    },
    'Unhandled error'
  );

  const statusCode = (error as any).statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    responseObject: null,
    statusCode,
  });
};
```

## 🔄 Git Workflow

### Branch Strategy

- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency fixes

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
git commit -m "feat(auth): add email verification functionality"
git commit -m "fix(user): resolve password hashing issue"
git commit -m "docs: update API documentation"
```

### Pre-commit Hooks

Husky and lint-staged are configured to run checks before commits:

```json
// package.json
{
  "lint-staged": {
    "**/*": "pnpm run format",
    "**/*.{js,ts}": "pnpm run lint:fix"
  }
}
```

## 🚀 Deployment

### Local Development

```bash
pnpm run dev
```

### Docker Development

```bash
pnpm run docker:build
pnpm run docker:run
```

### Kubernetes Development

```bash
pnpm run k8s:deploy
```

### Production Deployment

Handled by GitHub Actions on push to `main` or version tags.

## 📊 Monitoring & Observability

### Health Checks

- **Endpoint**: `/health-check`
- **Kubernetes**: Liveness and readiness probes
- **Response Time**: < 100ms

### Metrics

- Request count and duration
- Error rates
- Database connection pool status
- Memory and CPU usage

### Logging

- Structured JSON logs with Pino
- Request/response logging
- Error tracking with stack traces
- Performance metrics

## 🛡️ Security Best Practices

### Code Security

- Input validation with Zod schemas
- SQL injection prevention with TypeORM
- XSS protection with helmet
- Rate limiting to prevent abuse

### Authentication Security

- Secure password hashing with bcrypt
- JWT with short expiration times
- Email verification for new accounts
- Secure session management

### Infrastructure Security

- Non-root Docker containers
- Kubernetes security contexts
- Secret management with Kubernetes secrets
- Network policies for pod isolation

## 📚 Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [TypeORM Documentation](https://typeorm.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Pino Logger](https://getpino.io/)
- [Zod Validation](https://zod.dev/)
