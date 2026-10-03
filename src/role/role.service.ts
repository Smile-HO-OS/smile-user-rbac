import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY,
  USER_REPOSITORY,
  USER_ROLE_REPOSITORY,
} from '../constants';
import type { IPaginatedResult, IPaginationParams } from '../interfaces';
import type { IUserRepository } from '../user/repositories/user-repository.interface';
import { UserNotFoundException } from '../user/exceptions/user-not-found.exception';
import type { IUserRoleRepository } from '../authorization/repositories/user-role-repository.interface';
import { RoleStatus } from './enums/role-status.enum';
import { DuplicateRoleException } from './exceptions/duplicate-role.exception';
import { RoleNotFoundException } from './exceptions/role-not-found.exception';
import type { IRole } from './interfaces/role.interface';
import type { IUserRole } from './interfaces/user-role.interface';
import type {
  ICreateRoleInput,
  IRoleRepository,
  IUpdateRoleInput,
} from './repositories/role-repository.interface';

/** A role `code` must be safe to use as a stable, programmatic reference. */
const ROLE_CODE_PATTERN = /^[a-zA-Z0-9_.-]+$/;

/**
 * Manages roles for a consuming application and their assignment to users.
 * The package defines no roles of its own — every role's name, code and
 * description come from the application (e.g. Support's "Support Manager"
 * vs. Bookings' "Booking Admin"); this service only provides the reusable
 * behavior around whatever roles an application chooses to create.
 */
@Injectable()
export class RoleService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
    @Inject(USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async createRole(input: ICreateRoleInput): Promise<IRole> {
    this.validateCode(input.code);
    if (!input.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    const existing = await this.roleRepository.findByCode(input.code);
    if (existing) {
      throw new DuplicateRoleException(input.code);
    }

    return this.roleRepository.create(input);
  }

  async getRoleById(id: string): Promise<IRole> {
    if (!id?.trim()) {
      throw new BadRequestException('id is required');
    }

    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new RoleNotFoundException(id);
    }

    return role;
  }

  async getRoleByCode(code: string): Promise<IRole> {
    if (!code?.trim()) {
      throw new BadRequestException('code is required');
    }

    const role = await this.roleRepository.findByCode(code);
    if (!role) {
      throw new RoleNotFoundException(code);
    }

    return role;
  }

  async searchRoles(
    params: IPaginationParams,
  ): Promise<IPaginatedResult<IRole>> {
    if (!Number.isInteger(params.page) || params.page < 1) {
      throw new BadRequestException('page must be a positive integer');
    }
    if (!Number.isInteger(params.pageSize) || params.pageSize < 1) {
      throw new BadRequestException('pageSize must be a positive integer');
    }

    return this.roleRepository.search(params);
  }

  async updateRole(id: string, input: IUpdateRoleInput): Promise<IRole> {
    const role = await this.getRoleById(id);

    if (input.code !== undefined) {
      this.validateCode(input.code);
      if (input.code !== role.code) {
        const codeOwner = await this.roleRepository.findByCode(input.code);
        if (codeOwner && codeOwner.id !== id) {
          throw new DuplicateRoleException(input.code);
        }
      }
    }

    return this.roleRepository.update(id, input);
  }

  async activateRole(id: string): Promise<IRole> {
    return this.updateRole(id, { status: RoleStatus.ACTIVE });
  }

  async deactivateRole(id: string): Promise<IRole> {
    return this.updateRole(id, { status: RoleStatus.INACTIVE });
  }

  /**
   * Idempotent: assigning a role the user already has returns the existing
   * assignment instead of erroring.
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<IUserRole> {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }

    const role = await this.getRoleById(roleId);
    if (role.status !== RoleStatus.ACTIVE) {
      throw new BadRequestException(
        `Role "${role.code}" is not active and cannot be assigned`,
      );
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const existingAssignment = await this.userRoleRepository.findAssignment(
      userId,
      roleId,
    );
    if (existingAssignment) {
      return existingAssignment;
    }

    return this.userRoleRepository.assign(userId, roleId);
  }

  /**
   * Idempotent: removing a role the user does not have is a no-op rather
   * than an error, matching typical idempotent-delete semantics.
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }
    if (!roleId?.trim()) {
      throw new BadRequestException('roleId is required');
    }

    const existingAssignment = await this.userRoleRepository.findAssignment(
      userId,
      roleId,
    );
    if (!existingAssignment) {
      return;
    }

    await this.userRoleRepository.remove(userId, roleId);
  }

  async getUserRoles(userId: string): Promise<IRole[]> {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required');
    }

    return this.userRoleRepository.findRolesByUserId(userId);
  }

  private validateCode(code: string): void {
    if (!code?.trim()) {
      throw new BadRequestException('code is required');
    }
    if (!ROLE_CODE_PATTERN.test(code)) {
      throw new BadRequestException(
        'code must contain only letters, numbers, underscores, hyphens or dots',
      );
    }
  }
}
