import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRepository } from '@/api/user/userRepository';
import { User } from '@/common/entities/user.entity';
import { MailTrigger } from '@/common/enums/enumBase';
import { ResponseStatus } from '@/common/models/serviceResponse';
import { generateJwt, verifyJwt } from '@/common/utils/jwtUtils';
import { sendEmail } from '@/common/utils/mailService';

import { AuthService } from '../authService';
import type { Login } from '../schemas/authSchema';

// Mock dependencies
vi.mock('bcryptjs');
vi.mock('@/common/utils/jwtUtils');
vi.mock('@/common/utils/mailService');
vi.mock('@/server', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockUser: User;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock user repository
    mockUserRepository = {
      findByEmailAsync: vi.fn(),
      createUserAsync: vi.fn(),
      findByIdAsync: vi.fn(),
      updateUserAsync: vi.fn(),
    } as any;

    // Create auth service instance
    authService = new AuthService(mockUserRepository);

    // Mock user data
    mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
      password: 'hashedPassword123',
      name: 'Test User',
      bio: 'Test bio',
      avatarUrl: '',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectMembers: [],
      cardMembers: [],
      comments: [],
      notifications: [],
    };
  });

  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      bio: 'New user bio',
    } as User;

    it('should successfully register a new user', async () => {
      // Arrange
      const hashedPassword = 'hashedPassword123';
      const newUser = { ...registerData, id: '123', password: hashedPassword, isActive: false };
      const token = 'mock-jwt-token';

      mockUserRepository.findByEmailAsync.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);
      mockUserRepository.createUserAsync.mockResolvedValue(newUser);
      vi.mocked(generateJwt).mockReturnValue(token);
      vi.mocked(sendEmail).mockResolvedValue(undefined);

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully! Please check your email to activate your account.');
      expect(result.statusCode).toBe(StatusCodes.CREATED);
      expect(result.responseObject).toEqual(newUser);
      expect(mockUserRepository.findByEmailAsync).toHaveBeenCalledWith(registerData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 10);
      expect(mockUserRepository.createUserAsync).toHaveBeenCalledWith({
        ...registerData,
        password: hashedPassword,
      });
      expect(generateJwt).toHaveBeenCalledWith({ code: newUser.id });
      expect(sendEmail).toHaveBeenCalledWith(MailTrigger.VerifyEmail, {
        email: registerData.email,
        activationLink: `${process.env.FRONTEND_URL}/activate?token=${token}`,
      });
    });

    it('should return error when email already exists', async () => {
      // Arrange
      mockUserRepository.findByEmailAsync.mockResolvedValue(mockUser);

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Email already exists');
      expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(result.responseObject).toBeNull();
      expect(mockUserRepository.createUserAsync).not.toHaveBeenCalled();
    });

    it('should return error when user creation fails', async () => {
      // Arrange
      mockUserRepository.findByEmailAsync.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword' as never);
      mockUserRepository.createUserAsync.mockResolvedValue(null as any);

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error creating user');
      expect(result.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.responseObject).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockUserRepository.findByEmailAsync.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(`Error creating user: ${errorMessage}`);
      expect(result.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.responseObject).toBeNull();
    });
  });

  describe('login', () => {
    const loginData: Login = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      const activeUser = { ...mockUser, isActive: true };
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';

      mockUserRepository.findByEmailAsync.mockResolvedValue(activeUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(generateJwt).mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.statusCode).toBe(StatusCodes.OK);
      expect(result.responseObject).toEqual({
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        tokenType: 'Bearer',
      });
      expect(mockUserRepository.findByEmailAsync).toHaveBeenCalledWith(loginData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, activeUser.password);
      expect(generateJwt).toHaveBeenCalledTimes(2);
      expect(generateJwt).toHaveBeenCalledWith({ userId: activeUser.id });
    });

    it('should return error when user not found', async () => {
      // Arrange
      mockUserRepository.findByEmailAsync.mockResolvedValue(null);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
      expect(result.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.responseObject).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return error when user is not activated', async () => {
      // Arrange
      mockUserRepository.findByEmailAsync.mockResolvedValue(mockUser); // isActive: false

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('User is not activated');
      expect(result.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(result.responseObject).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return error when password is invalid', async () => {
      // Arrange
      const activeUser = { ...mockUser, isActive: true };
      mockUserRepository.findByEmailAsync.mockResolvedValue(activeUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid password');
      expect(result.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(result.responseObject).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, activeUser.password);
    });

    it('should handle login errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Database error';
      mockUserRepository.findByEmailAsync.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(`Error logging in: ${errorMessage}`);
      expect(result.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.responseObject).toBeNull();
    });
  });

  describe('verifyEmail', () => {
    const token = 'valid-jwt-token';
    const userId = '550e8400-e29b-41d4-a716-446655440001';

    it('should successfully verify email with valid token', async () => {
      // Arrange
      const decodedToken = { code: userId };
      const inactiveUser = { ...mockUser, isActive: false };
      const updatedUser = { ...mockUser, isActive: true };

      vi.mocked(verifyJwt).mockReturnValue(decodedToken);
      mockUserRepository.findByIdAsync.mockResolvedValue(inactiveUser);
      mockUserRepository.updateUserAsync.mockResolvedValue(updatedUser);

      // Act
      const result = await authService.verifyEmail(token);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(result.statusCode).toBe(StatusCodes.OK);
      expect(result.responseObject).toBe(true);
      expect(verifyJwt).toHaveBeenCalledWith(token);
      expect(mockUserRepository.findByIdAsync).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.updateUserAsync).toHaveBeenCalledWith(userId, {
        ...inactiveUser,
        isActive: true,
      });
    });

    it('should return success when email is already verified', async () => {
      // Arrange
      const decodedToken = { code: userId };
      const activeUser = { ...mockUser, isActive: true };

      vi.mocked(verifyJwt).mockReturnValue(decodedToken);
      mockUserRepository.findByIdAsync.mockResolvedValue(activeUser);

      // Act
      const result = await authService.verifyEmail(token);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email already verified');
      expect(result.statusCode).toBe(StatusCodes.OK);
      expect(result.responseObject).toBe(true);
      expect(mockUserRepository.updateUserAsync).not.toHaveBeenCalled();
    });

    it('should return error when token format is invalid', async () => {
      // Arrange
      vi.mocked(verifyJwt).mockReturnValue('invalid-format');

      // Act
      const result = await authService.verifyEmail(token);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid token format');
      expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(result.responseObject).toBe(false);
      expect(mockUserRepository.findByIdAsync).not.toHaveBeenCalled();
    });

    it('should return error when user not found', async () => {
      // Arrange
      const decodedToken = { code: userId };
      vi.mocked(verifyJwt).mockReturnValue(decodedToken);
      mockUserRepository.findByIdAsync.mockResolvedValue(null);

      // Act
      const result = await authService.verifyEmail(token);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
      expect(result.statusCode).toBe(StatusCodes.NOT_FOUND);
      expect(result.responseObject).toBe(false);
      expect(mockUserRepository.findByIdAsync).toHaveBeenCalledWith(userId);
    });

    it('should handle JWT verification errors', async () => {
      // Arrange
      const errorMessage = 'Invalid token';
      vi.mocked(verifyJwt).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Act
      const result = await authService.verifyEmail(token);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(`Error verifying email: ${errorMessage}`);
      expect(result.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.responseObject).toBe(false);
    });

    it('should handle database errors during verification', async () => {
      // Arrange
      const decodedToken = { code: userId };
      const errorMessage = 'Database error';
      vi.mocked(verifyJwt).mockReturnValue(decodedToken);
      mockUserRepository.findByIdAsync.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await authService.verifyEmail(token);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(`Error verifying email: ${errorMessage}`);
      expect(result.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.responseObject).toBe(false);
    });
  });
});
