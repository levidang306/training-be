import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';

import { UserRepository } from '@/api/user/userRepository';
import { User } from '@/common/entities/user.entity';
import { MailTrigger } from '@/common/enums/enumBase';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { calculateUnixTime } from '@/common/utils/';
import { generateJwt, verifyJwt } from '@/common/utils/jwtUtils';
import { sendEmail } from '@/common/utils/mailService';
import { logger } from '@/server';

import { Login, Token } from './schemas/authSchema';

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  // Register user
  async register(userData: User): Promise<ServiceResponse<User | null>> {
    try {
      const user = await this.userRepository.findByEmailAsync(userData.email);
      if (user) {
        return new ServiceResponse(ResponseStatus.Failed, 'Email already exists', null, StatusCodes.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const newUser = await this.userRepository.createUserAsync({
        ...userData,
        password: hashedPassword,
      });

      if (!newUser) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Error creating user',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      const activationLink = `${process.env.FRONTEND_URL}/activate?token=${generateJwt({ code: newUser.id })}`;
      sendEmail(MailTrigger.VerifyEmail, { email: userData.email, activationLink });

      return new ServiceResponse<User>(
        ResponseStatus.Success,
        'User registered successfully! Please check your email to activate your account.',
        newUser,
        StatusCodes.CREATED
      );
    } catch (ex) {
      const errorMessage = `Error creating user: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<ServiceResponse<boolean>> {
    try {
      const decoded = verifyJwt(token);

      // Extract the user ID from the decoded JWT payload
      let userId: string;
      if (typeof decoded === 'object' && decoded !== null && 'code' in decoded) {
        userId = (decoded as any).code;
      } else {
        return new ServiceResponse(ResponseStatus.Failed, 'Invalid token format', false, StatusCodes.BAD_REQUEST);
      }

      const user = await this.userRepository.findByIdAsync(userId);
      if (!user) {
        return new ServiceResponse(ResponseStatus.Failed, 'User not found', false, StatusCodes.NOT_FOUND);
      }

      if (user.isActive) {
        return new ServiceResponse(ResponseStatus.Success, 'Email already verified', true, StatusCodes.OK);
      }

      user.isActive = true;
      await this.userRepository.updateUserAsync(user.id, user);

      return new ServiceResponse<boolean>(ResponseStatus.Success, 'Email verified successfully', true, StatusCodes.OK);
    } catch (ex) {
      const errorMessage = `Error verifying email: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, false, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Login user
  async login(loginData: Login): Promise<ServiceResponse<Token | null>> {
    try {
      const user = await this.userRepository.findByEmailAsync(loginData.email);
      if (!user) {
        return new ServiceResponse(ResponseStatus.Failed, 'User not found', null, StatusCodes.NOT_FOUND);
      }

      if (!user.isActive) {
        return new ServiceResponse(ResponseStatus.Failed, 'User is not activated', null, StatusCodes.UNAUTHORIZED);
      }

      const passwordMatch = await bcrypt.compare(loginData.password, user.password);
      if (!passwordMatch) {
        return new ServiceResponse(ResponseStatus.Failed, 'Invalid password', null, StatusCodes.UNAUTHORIZED);
      }

      const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
      const token: Token = {
        accessToken: generateJwt({ userId: user.id }),
        refreshToken: generateJwt({ userId: user.id }),
        expiresIn: expiresIn,
        tokenType: 'Bearer',
      };

      return new ServiceResponse<Token>(ResponseStatus.Success, 'Login successful', token, StatusCodes.OK);
    } catch (ex) {
      const errorMessage = `Error logging in: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const authService = new AuthService(new UserRepository());
