import { StatusCodes } from 'http-status-codes';

import { CreateUserType, UserType } from '@/api/user/userModel';
import { UserRepository } from '@/api/user/userRepository';
import { ResponseStatus, ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  // Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<UserType[] | null>> {
    try {
      const users = await this.userRepository.findAll();
      if (!users || users.length === 0) {
        return new ServiceResponse(ResponseStatus.Failed, 'No Users found', null, StatusCodes.NOT_FOUND);
      }
      return new ServiceResponse<UserType[]>(ResponseStatus.Success, 'Users found', users, StatusCodes.OK);
    } catch (ex) {
      const errorMessage = `Error finding all users: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Retrieves a single user by their ID
  async findById(id: string): Promise<ServiceResponse<UserType | null>> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        return new ServiceResponse(ResponseStatus.Failed, 'User not found', null, StatusCodes.NOT_FOUND);
      }
      return new ServiceResponse<UserType>(ResponseStatus.Success, 'User found', user, StatusCodes.OK);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  // Creates a new user in the database
  async create(userData: CreateUserType): Promise<ServiceResponse<UserType | null>> {
    try {
      const newUser = await this.userRepository.createUser(userData);
      if (!newUser) {
        return new ServiceResponse(
          ResponseStatus.Failed,
          'Error creating user',
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      // const activationLink = 'https://example.com/activate';
      // sendEmail(MailTrigger.VerifyEmail, { email: userData.email, activationLink });
      return new ServiceResponse<UserType>(
        ResponseStatus.Success,
        'User created successfully',
        newUser,
        StatusCodes.CREATED
      );
    } catch (ex) {
      const errorMessage = `Error creating user: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(ResponseStatus.Failed, errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

// Create a singleton instance for backward compatibility
export const userService = new UserService(new UserRepository());
