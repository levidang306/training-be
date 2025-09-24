# 🧪 Testing Guide

## 🌟 Overview

This guide covers the comprehensive testing strategy for the Task Management Backend, including unit tests, integration tests, and end-to-end testing approaches.

## 🏗️ Testing Architecture

### Test Pyramid

```
        /\
       /  \
      / E2E \     ← Few tests, high confidence
     /______\
    /        \
   /Integration\ ← Some tests, medium confidence
  /__________\
 /            \
/   Unit Tests  \ ← Many tests, fast feedback
/________________\
```

### Testing Framework Stack

- **Test Runner**: Vitest
- **Assertion Library**: Vitest (built-in)
- **Mocking**: Vitest (built-in)
- **HTTP Testing**: Supertest
- **Database Testing**: In-memory SQLite / Test PostgreSQL
- **Coverage**: V8 Provider

## 📊 Current Test Coverage

```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
All files              |   76.31 |    68.96 |   73.91 |   76.31
src                    |   66.66 |       50 |   33.33 |   66.66
src/api/auth           |     100 |      100 |     100 |     100
src/api/user           |   91.66 |    85.71 |     100 |   91.66
src/common/middleware  |     100 |      100 |     100 |     100
src/common/utils       |   56.25 |        0 |      25 |   56.25
```

**Target Coverage**: 80% minimum, 90% for critical paths

## 🧪 Unit Testing

### Test Structure

```
src/
├── api/
│   ├── auth/
│   │   ├── __tests__/
│   │   │   ├── authService.test.ts     # Business logic tests
│   │   │   ├── authRouter.test.ts      # Route handler tests
│   │   │   └── authSchema.test.ts      # Validation tests
│   │   ├── authService.ts
│   │   ├── authRouter.ts
│   │   └── authSchema.ts
│   └── user/
│       ├── __tests__/
│       │   ├── userService.test.ts
│       │   ├── userRouter.test.ts
│       │   └── userRepository.test.ts
│       ├── userService.ts
│       ├── userRouter.ts
│       └── userRepository.ts
└── common/
    ├── middleware/
    │   └── __tests__/
    │       ├── errorHandler.test.ts
    │       ├── authentication.test.ts
    │       └── rateLimiter.test.ts
    └── utils/
        └── __tests__/
            ├── jwtUtils.test.ts
            ├── passwordUtils.test.ts
            └── emailUtils.test.ts
```

### Service Layer Testing

```typescript
// authService.test.ts
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { AuthService } from '../authService';
import { UserRepository } from '../../user/userRepository';
import { MailService } from '../../common/services/mailService';

// Mock dependencies
vi.mock('../../user/userRepository');
vi.mock('../../common/services/mailService');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: MockedFunction<any>;
  let mockMailService: MockedFunction<any>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock instances
    mockUserRepository = vi.mocked(UserRepository);
    mockMailService = vi.mocked(MailService);

    // Initialize service with mocks
    authService = new AuthService(mockUserRepository, mockMailService);
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUser = {
        id: 'uuid-123',
        ...userData,
        password: 'hashed-password',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockMailService.sendVerificationEmail.mockResolvedValue(true);

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.responseObject.user.email).toBe(userData.email);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        })
      );
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(userData.email, expect.any(String));
    });

    it('should throw error when email already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepository.findByEmail.mockResolvedValue({ id: '123' });

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow('Email already exists');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'uuid-123',
        email: loginData.email,
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.responseObject.accessToken).toBeDefined();
      expect(result.responseObject.user.email).toBe(loginData.email);
    });

    it('should reject login with invalid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.message).toBe('Invalid credentials');
    });
  });
});
```

### Router Testing

```typescript
// authRouter.test.ts
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { app } from '../../../server';
import { AuthService } from '../authService';

// Mock the service
vi.mock('../authService');

describe('Auth Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockResponse = {
        success: true,
        message: 'User registered successfully',
        responseObject: {
          user: { ...userData, id: 'uuid-123', isEmailVerified: false },
        },
        statusCode: 201,
      };

      vi.mocked(AuthService.prototype.register).mockResolvedValue(mockResponse);

      // Act
      const response = await request(app).post('/auth/register').send(userData).expect(201);

      // Assert
      expect(response.body).toEqual(mockResponse);
      expect(AuthService.prototype.register).toHaveBeenCalledWith(userData);
    });

    it('should validate required fields', async () => {
      // Act
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          firstName: '', // Empty
          lastName: 'Doe',
        })
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');
      expect(response.body.responseObject.errors).toHaveLength(3);
    });

    it('should handle service errors', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      vi.mocked(AuthService.prototype.register).mockRejectedValue(new Error('Email already exists'));

      // Act
      const response = await request(app).post('/auth/register').send(userData).expect(500);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Internal server error');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        success: true,
        message: 'Login successful',
        responseObject: {
          accessToken: 'jwt-token',
          user: { email: loginData.email, firstName: 'John' },
        },
        statusCode: 200,
      };

      vi.mocked(AuthService.prototype.login).mockResolvedValue(mockResponse);

      // Act
      const response = await request(app).post('/auth/login').send(loginData).expect(200);

      // Assert
      expect(response.body).toEqual(mockResponse);
      expect(response.body.responseObject.accessToken).toBeDefined();
    });
  });
});
```

### Middleware Testing

```typescript
// authentication.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../authentication';
import * as jwtUtils from '../../utils/jwtUtils';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should authenticate valid token', async () => {
    // Arrange
    const mockPayload = { userId: 'uuid-123', email: 'test@example.com' };
    mockRequest.headers = {
      authorization: 'Bearer valid-jwt-token',
    };

    vi.spyOn(jwtUtils, 'verifyToken').mockReturnValue(mockPayload);

    // Act
    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(jwtUtils.verifyToken).toHaveBeenCalledWith('valid-jwt-token');
    expect(mockRequest.user).toEqual(mockPayload);
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should reject request without authorization header', async () => {
    // Act
    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Access token required',
      responseObject: null,
      statusCode: 401,
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject invalid token', async () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    vi.spyOn(jwtUtils, 'verifyToken').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    // Act
    authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired token',
      responseObject: null,
      statusCode: 401,
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
```

## 🔗 Integration Testing

### Database Integration Tests

```typescript
// userRepository.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DataSource } from 'typeorm';
import { UserRepository } from '../userRepository';
import { User } from '../../common/entities/user.entity';

describe('UserRepository Integration', () => {
  let dataSource: DataSource;
  let userRepository: UserRepository;

  beforeAll(async () => {
    // Setup test database connection
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [User],
      synchronize: true,
      logging: false,
    });

    await dataSource.initialize();
    userRepository = new UserRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean database before each test
    await dataSource.createQueryBuilder().delete().from(User).execute();
  });

  describe('findByEmail', () => {
    it('should return user when email exists', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
      };

      await userRepository.create(userData);

      // Act
      const user = await userRepository.findByEmail('test@example.com');

      // Assert
      expect(user).toBeDefined();
      expect(user!.email).toBe('test@example.com');
      expect(user!.firstName).toBe('John');
    });

    it('should return null when email does not exist', async () => {
      // Act
      const user = await userRepository.findByEmail('nonexistent@example.com');

      // Assert
      expect(user).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'hashed-password',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      // Act
      const user = await userRepository.create(userData);

      // Assert
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      // Arrange
      const userData = {
        email: 'duplicate@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
      };

      await userRepository.create(userData);

      // Act & Assert
      await expect(userRepository.create(userData)).rejects.toThrow();
    });
  });
});
```

### API Integration Tests

```typescript
// auth.integration.test.ts
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { app } from '../../../server';
import { AppDataSource } from '../../../configs/typeorm.config';
import { User } from '../../../common/entities/user.entity';

describe('Auth API Integration', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean database
    await AppDataSource.createQueryBuilder().delete().from(User).execute();
  });

  describe('Registration Flow', () => {
    it('should complete full registration flow', async () => {
      const userData = {
        email: 'integration@example.com',
        password: 'password123',
        firstName: 'Integration',
        lastName: 'Test',
      };

      // Step 1: Register user
      const registerResponse = await request(app).post('/auth/register').send(userData).expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.responseObject.user.email).toBe(userData.email);
      expect(registerResponse.body.responseObject.user.isEmailVerified).toBe(false);

      // Step 2: Verify user exists in database
      const userRepository = AppDataSource.getRepository(User);
      const savedUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      expect(savedUser).toBeDefined();
      expect(savedUser!.isEmailVerified).toBe(false);

      // Step 3: Attempt login (should fail - email not verified)
      const loginResponse = await request(app).post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.message).toContain('email not verified');
    });
  });

  describe('Authentication Flow', () => {
    it('should authenticate user and access protected route', async () => {
      // Setup: Create verified user
      const userRepository = AppDataSource.getRepository(User);
      const hashedPassword = await bcrypt.hash('password123', 10);

      const user = userRepository.create({
        email: 'auth@example.com',
        password: hashedPassword,
        firstName: 'Auth',
        lastName: 'Test',
        isEmailVerified: true,
      });

      await userRepository.save(user);

      // Step 1: Login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'auth@example.com',
          password: 'password123',
        })
        .expect(200);

      const { accessToken } = loginResponse.body.responseObject;

      // Step 2: Access protected route
      const profileResponse = await request(app)
        .get('/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.responseObject.email).toBe('auth@example.com');
    });
  });
});
```

## 🎯 End-to-End Testing

### E2E Test Setup

```typescript
// e2e/setup.ts
import { beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { AppDataSource } from '../src/configs/typeorm.config';

let serverProcess: ChildProcess;

beforeAll(async () => {
  // Start server for E2E tests
  serverProcess = spawn('pnpm', ['run', 'start'], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3001',
      DB_DATABASE: 'task_management_e2e',
    },
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Initialize database
  await AppDataSource.initialize();
  await AppDataSource.synchronize();
}, 30000);

afterAll(async () => {
  await AppDataSource.destroy();
  serverProcess.kill();
});
```

### E2E Test Example

```typescript
// e2e/userJourney.e2e.test.ts
import request from 'supertest';
import { describe, it, expect } from 'vitest';

const baseURL = 'http://localhost:3001';

describe('User Journey E2E', () => {
  it('should complete full user lifecycle', async () => {
    const userData = {
      email: `e2e-${Date.now()}@example.com`,
      password: 'securePassword123',
      firstName: 'E2E',
      lastName: 'User',
    };

    // 1. Register
    const registerResponse = await request(baseURL).post('/auth/register').send(userData).expect(201);

    expect(registerResponse.body.success).toBe(true);

    // 2. Mock email verification (in real E2E, you'd check email)
    // For now, we'll manually verify the user in the database

    // 3. Login
    const loginResponse = await request(baseURL)
      .post('/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);

    const { accessToken } = loginResponse.body.responseObject;

    // 4. Get profile
    const profileResponse = await request(baseURL)
      .get('/user/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileResponse.body.responseObject.email).toBe(userData.email);

    // 5. Update profile
    const updateResponse = await request(baseURL)
      .put('/user/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'Updated',
        lastName: 'Name',
      })
      .expect(200);

    expect(updateResponse.body.responseObject.firstName).toBe('Updated');
  });
});
```

## 🔧 Test Configuration

### Vitest Configuration

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
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        'src/test/',
        'src/**/__tests__/',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 80,
          statements: 80,
        },
      },
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
```

### Test Environment Setup

```typescript
// src/test/setup.ts
import { beforeAll, afterAll, vi } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock external services
vi.mock('../common/services/mailService', () => ({
  MailService: vi.fn().mockImplementation(() => ({
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  })),
}));

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
});

afterAll(() => {
  // Cleanup
  vi.clearAllMocks();
});
```

## 📊 Running Tests

### Test Commands

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:dev

# Run tests with coverage
pnpm run test:cov

# Run specific test file
pnpm run test auth.test.ts

# Run tests matching pattern
pnpm run test --grep "should register user"

# Run tests for specific directory
pnpm run test src/api/auth

# Run integration tests only
pnpm run test:integration

# Run E2E tests only
pnpm run test:e2e
```

### CI/CD Testing

```yaml
# GitHub Actions test configuration
- name: 🧪 Run tests
  run: pnpm run test:ci
  env:
    NODE_ENV: test
    DB_HOST: localhost
    DB_PORT: 5432
    DB_USERNAME: postgres
    DB_PASSWORD: postgres
    DB_DATABASE: task_management_test
```

## 📈 Performance Testing

### Load Testing with Artillery

```yaml
# artillery.yml
config:
  target: 'http://localhost:8080'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Authentication flow'
    weight: 100
    flow:
      - post:
          url: '/auth/login'
          json:
            email: 'test@example.com'
            password: 'password123'
          capture:
            - json: '$.responseObject.accessToken'
              as: 'token'
      - get:
          url: '/user/profile'
          headers:
            Authorization: 'Bearer {{ token }}'
```

### Benchmark Tests

```typescript
// benchmark/auth.benchmark.ts
import { describe, it, bench } from 'vitest';
import bcrypt from 'bcryptjs';

describe('Password Hashing Benchmark', () => {
  const password = 'testPassword123';

  bench('bcrypt hash - rounds 10', async () => {
    await bcrypt.hash(password, 10);
  });

  bench('bcrypt hash - rounds 12', async () => {
    await bcrypt.hash(password, 12);
  });

  bench('bcrypt compare', async () => {
    const hash = await bcrypt.hash(password, 10);
    await bcrypt.compare(password, hash);
  });
});
```

## 🎯 Testing Best Practices

### Test Organization

- **AAA Pattern**: Arrange, Act, Assert
- **One assertion per test**: Test one thing at a time
- **Descriptive names**: Test names should explain what they test
- **Independent tests**: Tests should not depend on each other

### Mocking Strategy

- **Mock external dependencies**: APIs, databases, file systems
- **Don't mock what you own**: Test real implementations when possible
- **Mock at the boundary**: Mock at service/repository boundaries

### Data Management

- **Fresh data**: Each test should start with clean data
- **Realistic data**: Use data that resembles production
- **Test edge cases**: Empty arrays, null values, boundary conditions

### Async Testing

- **Always await**: Don't forget to await async operations
- **Proper error handling**: Test both success and failure cases
- **Timeout handling**: Set appropriate timeouts for long operations

## 🔍 Debugging Tests

### VS Code Debug Configuration

```json
{
  "name": "Debug Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "--no-coverage", "${relativeFile}"],
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"]
}
```

### Test Logging

```typescript
// Enable debug logging in tests
import { logger } from '../utils/logger';

describe('Service with logging', () => {
  it('should log important events', async () => {
    // Enable debug level for this test
    logger.level = 'debug';

    const result = await serviceMethod();

    // Check logs were created
    expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Processing request'));
  });
});
```

## 📚 Testing Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- [TypeORM Testing](https://typeorm.io/testing)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-6-testing-and-overall-quality-practices)
