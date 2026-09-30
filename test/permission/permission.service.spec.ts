import { BadRequestException } from '@nestjs/common';
import type { IRolePermissionRepository } from '../../src/authorization/repositories/role-permission-repository.interface';
import { PermissionAction } from '../../src/permission/enums/permission-action.enum';
import { PermissionStatus } from '../../src/permission/enums/permission-status.enum';
import { DuplicatePermissionException } from '../../src/permission/exceptions/duplicate-permission.exception';
import { PermissionNotFoundException } from '../../src/permission/exceptions/permission-not-found.exception';
import type { IPermission } from '../../src/permission/interfaces/permission.interface';
import type { IPermissionRepository } from '../../src/permission/repositories/permission-repository.interface';
import { PermissionService } from '../../src/permission/permission.service';
import { RoleStatus } from '../../src/role/enums/role-status.enum';
import { RoleNotFoundException } from '../../src/role/exceptions/role-not-found.exception';
import type { IRole } from '../../src/role/interfaces/role.interface';
import type { IRolePermission } from '../../src/role/interfaces/role-permission.interface';
import type { IRoleRepository } from '../../src/role/repositories/role-repository.interface';

function buildPermission(overrides: Partial<IPermission> = {}): IPermission {
  return {
    id: 'permission-1',
    code: 'ticket.create',
    resource: 'ticket',
    action: PermissionAction.CREATE,
    description: 'Create tickets',
    status: PermissionStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildRole(overrides: Partial<IRole> = {}): IRole {
  return {
    id: 'role-1',
    name: 'Support Manager',
    code: 'SUPPORT_MANAGER',
    description: 'Manages support tickets',
    status: RoleStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildRolePermission(
  overrides: Partial<IRolePermission> = {},
): IRolePermission {
  return {
    id: 'role-permission-1',
    roleId: 'role-1',
    permissionId: 'permission-1',
    createdAt: new Date(),
    ...overrides,
  };
}

function buildPermissionRepositoryMock(): IPermissionRepository {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByCode: vi.fn(),
    search: vi.fn(),
  };
}

function buildRolePermissionRepositoryMock(): IRolePermissionRepository {
  return {
    assign: vi.fn(),
    remove: vi.fn(),
    findPermissionsByRoleId: vi.fn(),
    findPermissionsByRoleIds: vi.fn(),
    findAssignment: vi.fn(),
  };
}

function buildRoleRepositoryMock(): IRoleRepository {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByCode: vi.fn(),
    search: vi.fn(),
  };
}

describe('PermissionService', () => {
  let permissionRepository: IPermissionRepository;
  let rolePermissionRepository: IRolePermissionRepository;
  let roleRepository: IRoleRepository;
  let service: PermissionService;

  beforeEach(() => {
    permissionRepository = buildPermissionRepositoryMock();
    rolePermissionRepository = buildRolePermissionRepositoryMock();
    roleRepository = buildRoleRepositoryMock();
    service = new PermissionService(
      permissionRepository,
      rolePermissionRepository,
      roleRepository,
    );
  });

  describe('createPermission', () => {
    it('creates a permission when the code is not already taken', async () => {
      const permission = buildPermission();
      vi.mocked(permissionRepository.findByCode).mockResolvedValue(null);
      vi.mocked(permissionRepository.create).mockResolvedValue(permission);

      const result = await service.createPermission({
        code: permission.code,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
      });

      expect(permissionRepository.findByCode).toHaveBeenCalledWith(
        permission.code,
      );
      expect(result).toEqual(permission);
    });

    it('throws DuplicatePermissionException when the code already exists', async () => {
      const permission = buildPermission();
      vi.mocked(permissionRepository.findByCode).mockResolvedValue(permission);

      await expect(
        service.createPermission({
          code: permission.code,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
        }),
      ).rejects.toThrow(DuplicatePermissionException);
      expect(permissionRepository.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for an empty resource', async () => {
      await expect(
        service.createPermission({
          code: 'ticket.create',
          resource: '',
          action: PermissionAction.CREATE,
          description: 'x',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for an invalid action', async () => {
      await expect(
        service.createPermission({
          code: 'ticket.create',
          resource: 'ticket',
          action: 'NOT_A_REAL_ACTION' as PermissionAction,
          description: 'x',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPermissionById', () => {
    it('returns the permission when found', async () => {
      const permission = buildPermission();
      vi.mocked(permissionRepository.findById).mockResolvedValue(permission);

      await expect(service.getPermissionById(permission.id)).resolves.toEqual(
        permission,
      );
    });

    it('throws PermissionNotFoundException when not found', async () => {
      vi.mocked(permissionRepository.findById).mockResolvedValue(null);

      await expect(service.getPermissionById('missing')).rejects.toThrow(
        PermissionNotFoundException,
      );
    });
  });

  describe('getPermissionByCode', () => {
    it('returns the permission when found', async () => {
      const permission = buildPermission();
      vi.mocked(permissionRepository.findByCode).mockResolvedValue(permission);

      await expect(
        service.getPermissionByCode(permission.code),
      ).resolves.toEqual(permission);
    });

    it('throws PermissionNotFoundException when not found', async () => {
      vi.mocked(permissionRepository.findByCode).mockResolvedValue(null);

      await expect(
        service.getPermissionByCode('missing.action'),
      ).rejects.toThrow(PermissionNotFoundException);
    });
  });

  describe('searchPermissions', () => {
    it('delegates to the repository with valid pagination', async () => {
      const paginated = {
        items: [buildPermission()],
        total: 1,
        page: 1,
        pageSize: 10,
      };
      vi.mocked(permissionRepository.search).mockResolvedValue(paginated);

      const result = await service.searchPermissions({
        page: 1,
        pageSize: 10,
      });

      expect(permissionRepository.search).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(paginated);
    });

    it('throws BadRequestException for a non-positive page', async () => {
      await expect(
        service.searchPermissions({ page: 0, pageSize: 10 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePermission', () => {
    it('updates the permission when the new code is unused', async () => {
      const permission = buildPermission();
      const updated = buildPermission({ code: 'ticket.update' });
      vi.mocked(permissionRepository.findById).mockResolvedValue(permission);
      vi.mocked(permissionRepository.findByCode).mockResolvedValue(null);
      vi.mocked(permissionRepository.update).mockResolvedValue(updated);

      const result = await service.updatePermission(permission.id, {
        code: 'ticket.update',
      });

      expect(permissionRepository.update).toHaveBeenCalledWith(permission.id, {
        code: 'ticket.update',
      });
      expect(result).toEqual(updated);
    });

    it('throws DuplicatePermissionException when the new code belongs to another permission', async () => {
      const permission = buildPermission();
      const otherPermission = buildPermission({
        id: 'permission-2',
        code: 'ticket.delete',
      });
      vi.mocked(permissionRepository.findById).mockResolvedValue(permission);
      vi.mocked(permissionRepository.findByCode).mockResolvedValue(
        otherPermission,
      );

      await expect(
        service.updatePermission(permission.id, { code: 'ticket.delete' }),
      ).rejects.toThrow(DuplicatePermissionException);
      expect(permissionRepository.update).not.toHaveBeenCalled();
    });

    it('throws PermissionNotFoundException when the permission does not exist', async () => {
      vi.mocked(permissionRepository.findById).mockResolvedValue(null);

      await expect(
        service.updatePermission('missing', { description: 'x' }),
      ).rejects.toThrow(PermissionNotFoundException);
    });
  });

  describe('activatePermission', () => {
    it('sets status to ACTIVE', async () => {
      const permission = buildPermission({ status: PermissionStatus.INACTIVE });
      const activated = buildPermission({ status: PermissionStatus.ACTIVE });
      vi.mocked(permissionRepository.findById).mockResolvedValue(permission);
      vi.mocked(permissionRepository.update).mockResolvedValue(activated);

      await expect(service.activatePermission(permission.id)).resolves.toEqual(
        activated,
      );
      expect(permissionRepository.update).toHaveBeenCalledWith(permission.id, {
        status: PermissionStatus.ACTIVE,
      });
    });
  });

  describe('deactivatePermission', () => {
    it('sets status to INACTIVE', async () => {
      const permission = buildPermission({ status: PermissionStatus.ACTIVE });
      const deactivated = buildPermission({
        status: PermissionStatus.INACTIVE,
      });
      vi.mocked(permissionRepository.findById).mockResolvedValue(permission);
      vi.mocked(permissionRepository.update).mockResolvedValue(deactivated);

      await expect(
        service.deactivatePermission(permission.id),
      ).resolves.toEqual(deactivated);
    });
  });

  describe('assignPermissionToRole', () => {
    it('assigns the permission when the role has no existing assignment', async () => {
      const role = buildRole();
      const permission = buildPermission();
      const assignment = buildRolePermission();
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(permissionRepository.findById).mockResolvedValue(permission);
      vi.mocked(rolePermissionRepository.findAssignment).mockResolvedValue(
        null,
      );
      vi.mocked(rolePermissionRepository.assign).mockResolvedValue(assignment);

      const result = await service.assignPermissionToRole(
        role.id,
        permission.id,
      );

      expect(rolePermissionRepository.assign).toHaveBeenCalledWith(
        role.id,
        permission.id,
      );
      expect(result).toEqual(assignment);
    });

    it('is idempotent: returns the existing assignment without reassigning', async () => {
      const role = buildRole();
      const permission = buildPermission();
      const assignment = buildRolePermission();
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(permissionRepository.findById).mockResolvedValue(permission);
      vi.mocked(rolePermissionRepository.findAssignment).mockResolvedValue(
        assignment,
      );

      const result = await service.assignPermissionToRole(
        role.id,
        permission.id,
      );

      expect(rolePermissionRepository.assign).not.toHaveBeenCalled();
      expect(result).toEqual(assignment);
    });

    it('throws RoleNotFoundException when the role does not exist', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null);

      await expect(
        service.assignPermissionToRole('missing-role', 'permission-1'),
      ).rejects.toThrow(RoleNotFoundException);
      expect(permissionRepository.findById).not.toHaveBeenCalled();
    });

    it('throws PermissionNotFoundException when the permission does not exist', async () => {
      const role = buildRole();
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(permissionRepository.findById).mockResolvedValue(null);

      await expect(
        service.assignPermissionToRole(role.id, 'missing-permission'),
      ).rejects.toThrow(PermissionNotFoundException);
    });

    it('throws BadRequestException when the permission is not active', async () => {
      const role = buildRole();
      const permission = buildPermission({
        status: PermissionStatus.INACTIVE,
      });
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(permissionRepository.findById).mockResolvedValue(permission);

      await expect(
        service.assignPermissionToRole(role.id, permission.id),
      ).rejects.toThrow(BadRequestException);
      expect(rolePermissionRepository.assign).not.toHaveBeenCalled();
    });
  });

  describe('removePermissionFromRole', () => {
    it('removes an existing assignment', async () => {
      const assignment = buildRolePermission();
      vi.mocked(rolePermissionRepository.findAssignment).mockResolvedValue(
        assignment,
      );

      await service.removePermissionFromRole(
        assignment.roleId,
        assignment.permissionId,
      );

      expect(rolePermissionRepository.remove).toHaveBeenCalledWith(
        assignment.roleId,
        assignment.permissionId,
      );
    });

    it('is a no-op when the permission is not currently assigned', async () => {
      vi.mocked(rolePermissionRepository.findAssignment).mockResolvedValue(
        null,
      );

      await service.removePermissionFromRole('role-1', 'permission-1');

      expect(rolePermissionRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getRolePermissions', () => {
    it('returns the permissions assigned to a role', async () => {
      const permissions = [buildPermission()];
      vi.mocked(
        rolePermissionRepository.findPermissionsByRoleId,
      ).mockResolvedValue(permissions);

      await expect(service.getRolePermissions('role-1')).resolves.toEqual(
        permissions,
      );
    });
  });
});
