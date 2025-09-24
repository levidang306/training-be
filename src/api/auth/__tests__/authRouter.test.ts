import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '@/server';

import { authService } from '../authService';

// Mock the auth service
vi.mock('../authService', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    verifyEmail: vi.fn(),
  },
}));

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    const validRegisterData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      bio: 'Test bio',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      const mockUser = {
        id: '123',
        ...validRegisterData,
        avatarUrl: '',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        projectMembers: [],
        cardMembers: [],
        comments: [],
        notifications: [],
      };

      const mockServiceResponse = {
        success: true,
        message: 'User registered successfully! Please check your email to activate your account.',
        responseObject: mockUser,
        statusCode: StatusCodes.CREATED,
      };

      vi.mocked(authService.register).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post('/auth/register').send(validRegisterData);

      // Assert
      expect(response.status).toBe(StatusCodes.CREATED);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        'User registered successfully! Please check your email to activate your account.'
      );
      expect(response.body.responseObject).toMatchObject({
        id: '123',
        email: validRegisterData.email,
        name: validRegisterData.name,
      });
      expect(authService.register).toHaveBeenCalledWith(validRegisterData);
    });

    it('should return error when email already exists', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        message: 'Email already exists',
        responseObject: null,
        statusCode: StatusCodes.BAD_REQUEST,
      };

      vi.mocked(authService.register).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post('/auth/register').send(validRegisterData);

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email already exists');
      expect(response.body.responseObject).toBeNull();
    });

    it('should return validation error for invalid email', async () => {
      // Arrange
      const invalidData = {
        ...validRegisterData,
        email: 'invalid-email',
      };

      // Act
      const response = await request(app).post('/auth/register').send(invalidData);

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid input');
    });

    it('should return validation error for missing required fields', async () => {
      // Arrange
      const incompleteData = {
        email: 'test@example.com',
        // missing password
      };

      // Act
      const response = await request(app).post('/auth/register').send(incompleteData);

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid input');
    });
  });

  describe('POST /auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      const mockToken = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: '1d',
        tokenType: 'Bearer',
      };

      const mockServiceResponse = {
        success: true,
        message: 'Login successful',
        responseObject: mockToken,
        statusCode: StatusCodes.OK,
      };

      vi.mocked(authService.login).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post('/auth/login').send(validLoginData);

      // Assert
      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.responseObject).toEqual(mockToken);
      expect(authService.login).toHaveBeenCalledWith(validLoginData);
    });

    it('should return error for invalid credentials', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        message: 'Invalid password',
        responseObject: null,
        statusCode: StatusCodes.UNAUTHORIZED,
      };

      vi.mocked(authService.login).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post('/auth/login').send(validLoginData);

      // Assert
      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid password');
      expect(response.body.responseObject).toBeNull();
    });

    it('should return error when user not found', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        message: 'User not found',
        responseObject: null,
        statusCode: StatusCodes.NOT_FOUND,
      };

      vi.mocked(authService.login).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post('/auth/login').send(validLoginData);

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return error when user is not activated', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        message: 'User is not activated',
        responseObject: null,
        statusCode: StatusCodes.UNAUTHORIZED,
      };

      vi.mocked(authService.login).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post('/auth/login').send(validLoginData);

      // Assert
      expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User is not activated');
    });

    it('should return validation error for invalid email format', async () => {
      // Arrange
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      // Act
      const response = await request(app).post('/auth/login').send(invalidData);

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid input');
    });

    it('should return validation error for missing password', async () => {
      // Arrange
      const incompleteData = {
        email: 'test@example.com',
        // missing password
      };

      // Act
      const response = await request(app).post('/auth/login').send(incompleteData);

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid input');
    });
  });

  describe('POST /auth/verify-email', () => {
    const validToken = 'valid-jwt-token';

    it('should verify email successfully with valid token', async () => {
      // Arrange
      const mockServiceResponse = {
        success: true,
        message: 'Email verified successfully',
        responseObject: true,
        statusCode: StatusCodes.OK,
      };

      vi.mocked(authService.verifyEmail).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post(`/auth/verify-email?token=${validToken}`);

      // Assert
      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email verified successfully');
      expect(response.body.responseObject).toBe(true);
      expect(authService.verifyEmail).toHaveBeenCalledWith(validToken);
    });

    it('should return success when email is already verified', async () => {
      // Arrange
      const mockServiceResponse = {
        success: true,
        message: 'Email already verified',
        responseObject: true,
        statusCode: StatusCodes.OK,
      };

      vi.mocked(authService.verifyEmail).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post(`/auth/verify-email?token=${validToken}`);

      // Assert
      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email already verified');
    });

    it('should return error for invalid token format', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        message: 'Invalid token format',
        responseObject: false,
        statusCode: StatusCodes.BAD_REQUEST,
      };

      vi.mocked(authService.verifyEmail).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post(`/auth/verify-email?token=${validToken}`);

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token format');
      expect(response.body.responseObject).toBe(false);
    });

    it('should return error when user not found', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        message: 'User not found',
        responseObject: false,
        statusCode: StatusCodes.NOT_FOUND,
      };

      vi.mocked(authService.verifyEmail).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post(`/auth/verify-email?token=${validToken}`);

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return validation error for missing token', async () => {
      // Act
      const response = await request(app).post('/auth/verify-email');

      // Assert
      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid input');
    });

    it('should return error for expired or invalid token', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        message: 'Error verifying email: Invalid or expired token',
        responseObject: false,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      };

      vi.mocked(authService.verifyEmail).mockResolvedValue(mockServiceResponse);

      // Act
      const response = await request(app).post(`/auth/verify-email?token=expired-token`);

      // Assert
      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Error verifying email');
    });
  });
});
