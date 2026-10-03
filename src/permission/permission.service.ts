import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  PERMISSION_REPOSITORY,
  ROLE_PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
} from '../constants';
import type { IPaginatedResult, IPaginationParams } from '../interfaces';
import type { IRolePermissionRepository } from '../authorization/repositories/role-permission-repository.interface';
import { RoleNotFoundException } from '../role/exceptions/role-not-found.exception';
import type { IRolePermission } from '../role/interfaces/role-permission.interface';
import type { IRoleRepository } from '../role/repositories/role-repository.interface';
import { PermissionAction } from './enums/permission-action.enum';
import { PermissionStatus } from './enums/permission-status.enum';
import { DuplicatePermissionException } from './exceptions/duplicate-permission.exception';
import { PermissionNotFoundException } from './exceptions/permission-not-found.exception';
import type { IPermission } from './interfaces/permission.interface';
import type {
  ICreatePermissionInput,
  IPermissionRepository,
  IUpdatePermissionInput,
} from './repositories/permission-repository.interface';

/** A permission `code` must be safe to use as a stable authorization key. */
const PERMISSION_CODE_PATTERN = /^[a-zA-Z0-9_.-]+$/;

/**
 * Manages permissions for a consuming application and their assignment to
 * roles. The package defines no permissions of its own — every permission's
 * `resource`/`action`/`code` (e.g. "ticket.create") comes from the
 * application; this service only provides the reusable behavior around
 * whatever permissions an application chooses to create.
 */
@Injectable()
export class PermissionService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
    @Inject(ROLE_PERMISSION_REPOSITORY)
    private readonly rolePermissionRepository: IRolePermissionRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
  ) {}

  async createPermission(input: ICreatePermissionInput): Promise<IPermission> {
    this.validateCode(input.code);
    this.validateResource(input.resource);
    this.validateAction(input.action);

    const existing = await this.permissionRepository.findByCode(input.code);
    if (existing) {
      throw new DuplicatePermissionException(input.code);
    }

    return this.permissionRepository.create(input);
  }

  async getPermissionById(id: string): Promise<IPermission> {
    if (!id?.trim()) {
      throw new BadRequestException('id is required');
    }

    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new PermissionNotFoundException(id);
    }

    return permission;
  }

  async getPermissionByCode(code: string): Promise<IPermission> {
    if (!code?.trim()) {
      throw new BadRequestException('code is required');
    }

    const permission = await this.permissionRepository.findByCode(code);
    if (!permission) {
      throw new PermissionNotFoundException(code);
    }

    return permission;
  }

  async searchPermissions(
    params: IPaginationParams,
  ): Promise<IPaginatedResult<IPermission>> {
    if (!Number.isInteger(params.page) || params.page < 1) {
      throw new BadRequestException('page must be a positive integer');
    }
    if (!Number.isInteger(params.pageSize) || params.pageSize < 1) {
      throw new BadRequestException('pageSize must be a positive integer');
    }

    return this.permissionRepository.search(params);
  }

  async updatePermission(
    id: string,
    input: IUpdatePermissionInput,
  ): Promise<IPermission> {
    const permission = await this.getPermissionById(id);

    if (input.code !== undefined) {
      this.validateCode(input.code);
      if (input.code !== permission.code) {
        const codeOwner = await this.permissionRepository.findByCode(
          input.code,
        );
        if (codeOwner && codeOwner.id !== id) {
          throw new DuplicatePermissionException(input.code);
        }
      }
    }
    if (input.resource !== undefined) {
      this.validateResource(input.resource);
    }
    if (input.action !== undefined) {
      this.validateAction(input.action);
    }

    return this.permissionRepository.update(id, input);
  }

  async activatePermission(id: string): Promise<IPermission> {
    return this.updatePermission(id, { status: PermissionStatus.ACTIVE });
  }

  async deactivatePermission(id: string): Promise<IPermission> {
    return this.updatePermission(id, { status: PermissionStatus.INACTIVE });
  }

  /**
   * Idempotent: assigning a permission the role already has returns the
   * existing assignment instead of erroring.
   */
  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<IRolePermission> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new RoleNotFoundException(roleId);
    }

    const permission = await this.getPermissionById(permissionId);
    if (permission.status !== PermissionStatus.ACTIVE) {
      throw new BadRequestException(
        `Permission "${permission.code}" is not active and cannot be assigned`,
      );
    }

    const existingAssignment =
      await this.rolePermissionRepository.findAssignment(roleId, permissionId);
    if (existingAssignment) {
      return existingAssignment;
    }

    return this.rolePermissionRepository.assign(roleId, permissionId);
  }

  /**
   * Idempotent: removing a permission the role does not have is a no-op
   * rather than an error, matching typical idempotent-delete semantics.
   */
  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    if (!roleId?.trim()) {
      throw new BadRequestException('roleId is required');
    }
    if (!permissionId?.trim()) {
      throw new BadRequestException('permissionId is required');
    }

    const existingAssignment =
      await this.rolePermissionRepository.findAssignment(roleId, permissionId);
    if (!existingAssignment) {
      return;
    }

    await this.rolePermissionRepository.remove(roleId, permissionId);
  }

  async getRolePermissions(roleId: string): Promise<IPermission[]> {
    if (!roleId?.trim()) {
      throw new BadRequestException('roleId is required');
    }

    return this.rolePermissionRepository.findPermissionsByRoleId(roleId);
  }

  private validateCode(code: string): void {
    if (!code?.trim()) {
      throw new BadRequestException('code is required');
    }
    if (!PERMISSION_CODE_PATTERN.test(code)) {
      throw new BadRequestException(
        'code must contain only letters, numbers, underscores, hyphens or dots',
      );
    }
  }

  private validateResource(resource: string): void {
    if (!resource?.trim()) {
      throw new BadRequestException('resource is required');
    }
  }

  private validateAction(action: PermissionAction): void {
    if (!Object.values(PermissionAction).includes(action)) {
      throw new BadRequestException('action must be a valid PermissionAction');
    }
  }
}
