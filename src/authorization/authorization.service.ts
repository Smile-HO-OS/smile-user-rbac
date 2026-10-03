import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ROLE_PERMISSION_REPOSITORY,
  USER_REPOSITORY,
  USER_ROLE_REPOSITORY,
} from '../constants';
import { PermissionStatus } from '../permission/enums/permission-status.enum';
import type { IPermission } from '../permission/interfaces/permission.interface';
import { RoleStatus } from '../role/enums/role-status.enum';
import type { IRole } from '../role/interfaces/role.interface';
import { UserStatus } from '../user/enums/user-status.enum';
import type { IUser } from '../user/interfaces/user.interface';
import type { IUserRepository } from '../user/repositories/user-repository.interface';
import { AuthorizationDeniedException } from './exceptions/authorization-denied.exception';
import type { IAuthorizationResult } from './interfaces/authorization-result.interface';
import type { IAuthorizationService } from './interfaces/authorization-service.interface';
import type { IRolePermissionRepository } from './repositories/role-permission-repository.interface';
import type { IUserRoleRepository } from './repositories/user-role-repository.interface';

/**
 * Resolves whether a user has a given permission by walking
 * User → UserRole → Role → RolePermission → Permission, considering only
 * active users, active roles and active permissions. Does not touch any
 * authentication or application-access checks — this only answers "does
 * this already-identified local user have this permission" for the
 * application's own RBAC data. An unknown user is treated like an inactive
 * one: nothing is granted, and nothing throws except blank input (400) and
 * repository failures (propagated).
 */
@Injectable()
export class AuthorizationService implements IAuthorizationService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(USER_ROLE_REPOSITORY)
    private readonly userRoleRepository: IUserRoleRepository,
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly rolePermissionRepository: IRolePermissionRepository,
  ) {}

  async hasPermission(
    userId: string,
    permissionCode: string,
  ): Promise<boolean> {
    this.requireNonEmpty(userId, 'userId');
    this.requireNonEmpty(permissionCode, 'permissionCode');

    const result = await this.evaluate(userId, permissionCode);
    return result.allowed;
  }

  async authorize(userId: string, permissionCode: string): Promise<void> {
    this.requireNonEmpty(userId, 'userId');
    this.requireNonEmpty(permissionCode, 'permissionCode');

    const result = await this.evaluate(userId, permissionCode);
    if (!result.allowed) {
      throw new AuthorizationDeniedException(
        userId,
        permissionCode,
        result.reason ?? 'permission not granted',
      );
    }
  }

  async getUserPermissions(userId: string): Promise<IPermission[]> {
    this.requireNonEmpty(userId, 'userId');

    const user = await this.findActiveUser(userId);
    if (!user) {
      return [];
    }

    return this.resolveEffectivePermissions(userId);
  }

  async getUserRoles(userId: string): Promise<IRole[]> {
    this.requireNonEmpty(userId, 'userId');

    const user = await this.findActiveUser(userId);
    if (!user) {
      return [];
    }

    return this.resolveActiveRoles(userId);
  }

  private async evaluate(
    userId: string,
    permissionCode: string,
  ): Promise<IAuthorizationResult> {
    const user = await this.findActiveUser(userId);
    if (!user) {
      return { allowed: false, reason: 'user is not active or does not exist' };
    }

    const permissions = await this.resolveEffectivePermissions(userId);
    const granted = permissions.some(
      (permission) => permission.code === permissionCode,
    );

    return granted
      ? { allowed: true }
      : {
          allowed: false,
          reason: `permission "${permissionCode}" is not granted`,
        };
  }

  /** `null` (not an error) when the user is missing or inactive. */
  private async findActiveUser(userId: string): Promise<IUser | null> {
    const user = await this.userRepository.findById(userId);
    return user?.status === UserStatus.ACTIVE ? user : null;
  }

  private async resolveActiveRoles(userId: string): Promise<IRole[]> {
    const roles = await this.userRoleRepository.findRolesByUserId(userId);
    return roles.filter((role) => role.status === RoleStatus.ACTIVE);
  }

  /**
   * Combines permissions across all of a user's active roles into one
   * deduplicated, active-only set, keyed by permission `code` so two roles
   * granting the same permission still produce a single entry.
   */
  private async resolveEffectivePermissions(
    userId: string,
  ): Promise<IPermission[]> {
    const activeRoles = await this.resolveActiveRoles(userId);
    if (activeRoles.length === 0) {
      return [];
    }

    const permissions =
      await this.rolePermissionRepository.findPermissionsByRoleIds(
        activeRoles.map((role) => role.id),
      );

    const uniqueActivePermissions = new Map<string, IPermission>();
    for (const permission of permissions) {
      if (permission.status === PermissionStatus.ACTIVE) {
        uniqueActivePermissions.set(permission.code, permission);
      }
    }

    return [...uniqueActivePermissions.values()];
  }

  private requireNonEmpty(value: string, fieldName: string): void {
    if (!value?.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }
}
