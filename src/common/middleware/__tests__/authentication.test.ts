import { NextFunction, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock JWT utils first
vi.mock('@/common/utils/jwtUtils', () => ({
  verifyJwt: vi.fn(),
}));

import { verifyJwt } from '@/common/utils/jwtUtils';

import authenticateJWT from '../authentication';

const mockVerifyJwt = vi.mocked(verifyJwt);

describe('Authentication Middleware', () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('authenticateJWT', () => {
    it('should authenticate valid JWT token successfully', () => {
      // Arrange
      const mockPayload = { userId: '123', email: 'test@example.com' };
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      mockVerifyJwt.mockReturnValue(mockPayload);

      // Act
      authenticateJWT(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockVerifyJwt).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      authenticateJWT(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Basic invalid-token',
      };

      // Act
      authenticateJWT(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT verification throws error', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };
      mockVerifyJwt.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      authenticateJWT(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockVerifyJwt).toHaveBeenCalledWith('invalid-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT verification returns string instead of object', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer string-token',
      };
      mockVerifyJwt.mockReturnValue('string-payload');

      // Act
      authenticateJWT(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockVerifyJwt).toHaveBeenCalledWith('string-token');
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle JWT verification errors gracefully', () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };
      mockVerifyJwt.mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act
      authenticateJWT(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockVerifyJwt).toHaveBeenCalledWith('expired-token');
      expect(consoleErrorSpy).toHaveBeenCalledWith('JWT verification failed:', expect.any(Error));
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should handle malformed authorization header gracefully', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer',
      };

      // Act
      authenticateJWT(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with complex JWT payload', () => {
      // Arrange
      const complexPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['read', 'write'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      mockRequest.headers = {
        authorization: 'Bearer complex-token',
      };
      mockVerifyJwt.mockReturnValue(complexPayload);

      // Act
      authenticateJWT(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockVerifyJwt).toHaveBeenCalledWith('complex-token');
      expect(mockRequest.user).toEqual(complexPayload);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should extract token correctly from Bearer format', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer token123',
      };
      mockVerifyJwt.mockReturnValue({ userId: '123' });

      // Act
      authenticateJWT(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockVerifyJwt).toHaveBeenCalledWith('token123');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
