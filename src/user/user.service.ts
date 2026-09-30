import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../constants';
import type { IPaginatedResult, IPaginationParams } from '../interfaces';
import { DuplicateUserException } from './exceptions/duplicate-user.exception';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { UserStatus } from './enums/user-status.enum';
import type { IUser } from './interfaces/user.interface';
import type {
  ICreateUserInput,
  IUpdateUserInput,
  IUserRepository,
} from './repositories/user-repository.interface';

/**
 * Manages the application's local User representation, keyed to IAM via
 * `iamUserId`. This does not authenticate the user or touch IAM's own
 * record — deactivating a local user here has no effect on the global IAM
 * identity; that synchronization is a later phase.
 */
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async createUser(input: ICreateUserInput): Promise<IUser> {
    if (!input.iamUserId?.trim()) {
      throw new BadRequestException('iamUserId is required');
    }

    const existing = await this.userRepository.findByIamUserId(input.iamUserId);
    if (existing) {
      throw new DuplicateUserException(input.iamUserId);
    }

    return this.userRepository.create(input);
  }

  async getUserById(id: string): Promise<IUser> {
    if (!id?.trim()) {
      throw new BadRequestException('id is required');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }

    return user;
  }

  async getUserByIamUserId(iamUserId: string): Promise<IUser> {
    if (!iamUserId?.trim()) {
      throw new BadRequestException('iamUserId is required');
    }

    const user = await this.userRepository.findByIamUserId(iamUserId);
    if (!user) {
      throw new UserNotFoundException(iamUserId);
    }

    return user;
  }

  async searchUsers(
    params: IPaginationParams,
  ): Promise<IPaginatedResult<IUser>> {
    if (!params.page || params.page < 1) {
      throw new BadRequestException('page must be a positive integer');
    }
    if (!params.pageSize || params.pageSize < 1) {
      throw new BadRequestException('pageSize must be a positive integer');
    }

    return this.userRepository.search(params);
  }

  /**
   * General-purpose update. `IUpdateUserInput` currently only carries
   * `status`, so this and `activateUser`/`deactivateUser` cover the same
   * ground today — see the Phase 4 report for why both are kept.
   */
  async updateUser(id: string, input: IUpdateUserInput): Promise<IUser> {
    await this.getUserById(id);
    return this.userRepository.update(id, input);
  }

  async activateUser(id: string): Promise<IUser> {
    return this.updateUser(id, { status: UserStatus.ACTIVE });
  }

  async deactivateUser(id: string): Promise<IUser> {
    return this.updateUser(id, { status: UserStatus.INACTIVE });
  }
}
