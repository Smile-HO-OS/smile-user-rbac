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
 * Manages the application's local User representation, keyed by `subjectId`
 * — an opaque identifier from whatever authentication the application uses.
 * This does not authenticate the user or touch any upstream identity
 * provider's own record; that synchronization, if the application needs
 * one at all, is its own concern.
 */
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async createUser(input: ICreateUserInput): Promise<IUser> {
    if (!input.subjectId?.trim()) {
      throw new BadRequestException('subjectId is required');
    }

    const existing = await this.userRepository.findBySubjectId(input.subjectId);
    if (existing) {
      throw new DuplicateUserException(input.subjectId);
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

  async getUserBySubjectId(subjectId: string): Promise<IUser> {
    if (!subjectId?.trim()) {
      throw new BadRequestException('subjectId is required');
    }

    const user = await this.userRepository.findBySubjectId(subjectId);
    if (!user) {
      throw new UserNotFoundException(subjectId);
    }

    return user;
  }

  async searchUsers(
    params: IPaginationParams,
  ): Promise<IPaginatedResult<IUser>> {
    if (!Number.isInteger(params.page) || params.page < 1) {
      throw new BadRequestException('page must be a positive integer');
    }
    if (!Number.isInteger(params.pageSize) || params.pageSize < 1) {
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
