import { StatusCodes } from 'http-status-codes';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { User } from '@/api/user/schemas';
import { UserRepository } from '@/api/user/userRepository';
import { UserService } from '@/api/user/userService';
import { ResponseStatus } from '@/common/models/serviceResponse';

// Mock the logger
vi.mock('@/server', () => ({
  ...vi.importActual('@/server'),
  logger: {
    error: vi.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: {
    findAll: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    createUser: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
  };

  const mockUsers: User[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'alice@example.com',
      password: 'hashedpassword123',
      name: 'Alice',
      bio: 'Software Developer',
      avatarUrl: 'https://example.com/alice.jpg',
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'bob@example.com',
      password: 'hashedpassword456',
      name: 'Bob',
      bio: 'Product Manager',
      avatarUrl: undefined,
      createdAt: new Date('2023-01-02T00:00:00Z'),
      updatedAt: new Date('2023-01-02T00:00:00Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock functions for the repository
    mockUserRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
    };

    // Create UserService with the mocked repository
    userService = new UserService(mockUserRepository as any);
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      // Arrange
      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await userService.findAll();

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.OK);
      expect(result.success).toBeTruthy();
      expect(result.message).toContain('Users found');
      expect(result.responseObject).toEqual(mockUsers);
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return not found when no users exist', async () => {
      // Arrange
      mockUserRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await userService.findAll();

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(result.success).toBeFalsy();
      expect(result.message).toContain('No Users found');
      expect(result.responseObject).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockUserRepository.findAll.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await userService.findAll();

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBeFalsy();
      expect(result.message).toContain('Error finding all users');
      expect(result.message).toContain(errorMessage);
      expect(result.responseObject).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user for a valid ID', async () => {
      // Arrange
      const testId = '550e8400-e29b-41d4-a716-446655440001';
      const mockUser = mockUsers.find((user) => user.id === testId);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await userService.findById(testId);

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.OK);
      expect(result.success).toBeTruthy();
      expect(result.message).toContain('User found');
      expect(result.responseObject).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(testId);
    });

    it('should return not found for non-existent ID', async () => {
      // Arrange
      const testId = '550e8400-e29b-41d4-a716-446655440999';
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await userService.findById(testId);

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(result.success).toBeFalsy();
      expect(result.message).toContain('User not found');
      expect(result.responseObject).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      const testId = '550e8400-e29b-41d4-a716-446655440001';
      const errorMessage = 'Database query failed';
      mockUserRepository.findById.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await userService.findById(testId);

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBeFalsy();
      expect(result.message).toContain(`Error finding user with id ${testId}`);
      expect(result.message).toContain(errorMessage);
      expect(result.responseObject).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const createUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        bio: 'Test bio',
      };

      const createdUser: User = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        ...createUserData,
        avatarUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.createUser.mockResolvedValue(createdUser);

      // Act
      const result = await userService.create(createUserData);

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.CREATED);
      expect(result.success).toBeTruthy();
      expect(result.message).toContain('User created');
      expect(result.responseObject).toEqual(createdUser);
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(createUserData);
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      const createUserData = {
        email: 'newuser@example.com',
        password: 'password123',
      };
      const errorMessage = 'Email already exists';
      mockUserRepository.createUser.mockRejectedValue(new Error(errorMessage));

      // Act
      const result = await userService.create(createUserData);

      // Assert
      expect(result.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBeFalsy();
      expect(result.message).toContain('Error creating user');
      expect(result.message).toContain(errorMessage);
      expect(result.responseObject).toBeNull();
    });
  });
});
