import { StatusCodes } from 'http-status-codes';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { User } from '@/api/user/schemas';
import { userService } from '@/api/user/userService';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { app } from '@/server';

// Mock the userService
vi.mock('@/api/user/userService', () => ({
  userService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

// Mock test data
const mockUsers: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'john@example.com',
    password: 'hashedpassword123',
    name: 'John Doe',
    bio: 'Software Developer',
    avatarUrl: 'https://example.com/avatar1.jpg',
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'jane@example.com',
    password: 'hashedpassword456',
    name: 'Jane Smith',
    bio: 'Product Manager',
    avatarUrl: 'https://example.com/avatar2.jpg',
    createdAt: new Date('2023-01-02T00:00:00Z'),
    updatedAt: new Date('2023-01-02T00:00:00Z'),
  },
];

const mockUserService = userService as any;

describe('User API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return a list of users', async () => {
      // Arrange
      mockUserService.findAll.mockResolvedValue(
        new ServiceResponse(ResponseStatus.Success, 'Users found', mockUsers, StatusCodes.OK)
      );

      // Act
      const response = await request(app).get('/users');
      const responseBody: ServiceResponse<User[]> = response.body;

      // Assert
      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(responseBody.success).toBeTruthy();
      expect(responseBody.message).toContain('Users found');
      expect(responseBody.responseObject.length).toEqual(mockUsers.length);
      responseBody.responseObject.forEach((user, index) => compareUsers(mockUsers[index], user));
    });

    it('should return no users found when database is empty', async () => {
      // Arrange
      mockUserService.findAll.mockResolvedValue(
        new ServiceResponse(ResponseStatus.Failed, 'No Users found', null, StatusCodes.NOT_FOUND)
      );

      // Act
      const response = await request(app).get('/users');
      const responseBody: ServiceResponse = response.body;

      // Assert
      expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(responseBody.success).toBeFalsy();
      expect(responseBody.message).toContain('No Users found');
      expect(responseBody.responseObject).toBeNull();
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user for a valid ID', async () => {
      // Arrange
      const testId = '550e8400-e29b-41d4-a716-446655440001';
      const expectedUser = mockUsers.find((user: User) => user.id === testId) as User;

      mockUserService.findById.mockResolvedValue(
        new ServiceResponse(ResponseStatus.Success, 'User found', expectedUser, StatusCodes.OK)
      );

      // Act
      const response = await request(app).get(`/users/${testId}`);
      const responseBody: ServiceResponse<User> = response.body;

      // Assert
      expect(response.statusCode).toEqual(StatusCodes.OK);
      expect(responseBody.success).toBeTruthy();
      expect(responseBody.message).toContain('User found');
      if (!expectedUser) throw new Error('Invalid test data: expectedUser is undefined');
      compareUsers(expectedUser, responseBody.responseObject);
    });

    it('should return a not found error for non-existent ID', async () => {
      // Arrange
      const testId = '550e8400-e29b-41d4-a716-446655440999';

      mockUserService.findById.mockResolvedValue(
        new ServiceResponse(ResponseStatus.Failed, 'User not found', null, StatusCodes.NOT_FOUND)
      );

      // Act
      const response = await request(app).get(`/users/${testId}`);
      const responseBody: ServiceResponse = response.body;

      // Assert
      expect(response.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(responseBody.success).toBeFalsy();
      expect(responseBody.message).toContain('User not found');
      expect(responseBody.responseObject).toBeNull();
    });

    it('should return a bad request for invalid ID format', async () => {
      // Act
      const invalidInput = 'invalid-uuid';
      const response = await request(app).get(`/users/${invalidInput}`);
      const responseBody: ServiceResponse = response.body;

      // Assert
      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(responseBody.success).toBeFalsy();
      expect(responseBody.message).toContain('Invalid input');
      expect(responseBody.responseObject).toBeNull();
    });
  });

  describe('POST /users', () => {
    it('should create a new user with valid data', async () => {
      // Arrange
      const newUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        bio: 'Test user',
      };

      const createdUser: User = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        ...newUserData,
        avatarUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.create.mockResolvedValue(
        new ServiceResponse(ResponseStatus.Success, 'User created', createdUser, StatusCodes.CREATED)
      );

      // Act
      const response = await request(app).post('/users').send(newUserData);
      const responseBody: ServiceResponse<User> = response.body;

      // Assert
      expect(response.statusCode).toEqual(StatusCodes.CREATED);
      expect(responseBody.success).toBeTruthy();
      expect(responseBody.message).toContain('User created');
      expect(responseBody.responseObject.email).toEqual(newUserData.email);
      expect(responseBody.responseObject.name).toEqual(newUserData.name);
    });

    it('should return bad request for invalid email', async () => {
      // Arrange
      const invalidUserData = {
        email: 'invalid-email',
        password: 'password123',
      };

      // Act
      const response = await request(app).post('/users').send(invalidUserData);
      const responseBody: ServiceResponse = response.body;

      // Assert
      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(responseBody.success).toBeFalsy();
      expect(responseBody.message).toContain('Invalid input');
    });

    it('should return bad request for missing required fields', async () => {
      // Arrange
      const incompleteUserData = {
        email: 'test@example.com',
        // missing password
      };

      // Act
      const response = await request(app).post('/users').send(incompleteUserData);
      const responseBody: ServiceResponse = response.body;

      // Assert
      expect(response.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(responseBody.success).toBeFalsy();
      expect(responseBody.message).toContain('Invalid input');
    });
  });
});

function compareUsers(mockUser: User, responseUser: User) {
  if (!mockUser || !responseUser) {
    throw new Error('Invalid test data: mockUser or responseUser is undefined');
  }

  expect(responseUser.id).toEqual(mockUser.id);
  expect(responseUser.name).toEqual(mockUser.name);
  expect(responseUser.email).toEqual(mockUser.email);
  expect(new Date(responseUser.createdAt)).toEqual(mockUser.createdAt);
  expect(new Date(responseUser.updatedAt)).toEqual(mockUser.updatedAt);
}
