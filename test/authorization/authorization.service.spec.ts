import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { IRolePermissionRepository } from '../../src/authorization/repositories/role-permission-repository.interface';
import type { IUserRoleRepository } from '../../src/authorization/repositories/user-role-repository.interface';
import { AuthorizationDeniedException } from '../../src/authorization/exceptions/authorization-denied.exception';
import { AuthorizationService } from '../../src/authorization/authorization.service';
import { PermissionAction } from '../../src/permission/enums/permission-action.enum';
import { PermissionStatus } from '../../src/permission/enums/permission-status.enum';
import type { IPermission } from '../../src/permission/interfaces/permission.interface';
import { RoleStatus } from '../../src/role/enums/role-status.enum';
import type { IRole } from '../../src/role/interfaces/role.interface';
import { UserStatus } from '../../src/user/enums/user-status.enum';
import type { IUser } from '../../src/user/interfaces/user.interface';
import type { IUserRepository } from '../../src/user/repositories/user-repository.interface';

function buildUser(overrides: Partial<IUser> = {}): IUser {
  return {
    id: 'user-1',
    subjectId: 'iam-1',
    status: UserStatus.ACTIVE,
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

function buildUserRepositoryMock(): IUserRepository {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findBySubjectId: vi.fn(),
    search: vi.fn(),
  };
}

function buildUserRoleRepositoryMock(): IUserRoleRepository {
  return {
    assign: vi.fn(),
    remove: vi.fn(),
    findRolesByUserId: vi.fn(),
    findAssignment: vi.fn(),
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

describe('AuthorizationService', () => {
  let userRepository: IUserRepository;
  let userRoleRepository: IUserRoleRepository;
  let rolePermissionRepository: IRolePermissionRepository;
  let service: AuthorizationService;

  beforeEach(() => {
    userRepository = buildUserRepositoryMock();
    userRoleRepository = buildUserRoleRepositoryMock();
    rolePermissionRepository = buildRolePermissionRepositoryMock();
    service = new AuthorizationService(
      userRepository,
      userRoleRepository,
      rolePermissionRepository,
    );
  });

  describe('hasPermission', () => {
    it('allows an active user with the required permission', async () => {
      const user = buildUser();
      const role = buildRole();
      const permission = buildPermission({ code: 'ticket.create' });
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findRolesByUserId).mockResolvedValue([role]);
      vi.mocked(
        rolePermissionRepository.findPermissionsByRoleIds,
      ).mockResolvedValue([permission]);

      await expect(
        service.hasPermission(user.id, 'ticket.create'),
      ).resolves.toBe(true);
      expect(
        rolePermissionRepository.findPermissionsByRoleIds,
      ).toHaveBeenCalledWith([role.id]);
    });

    it('denies an active user without the required permission, without throwing', async () => {
      const user = buildUser();
      const role = buildRole();
      const permission = buildPermission({ code: 'ticket.read' });
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findRolesByUserId).mockResolvedValue([role]);
      vi.mocked(
        rolePermissionRepository.findPermissionsByRoleIds,
      ).mockResolvedValue([permission]);

      await expect(
        service.hasPermission(user.id, 'ticket.delete'),
      ).resolves.toBe(false);
    });

    it('denies an inactive user', async () => {
      const user = buildUser({ status: UserStatus.INACTIVE });
      vi.mocked(userRepository.findById).mockResolvedValue(user);

      await expect(
        service.hasPermission(user.id, 'ticket.create'),
      ).resolves.toBe(false);
      expect(userRoleRepository.findRolesByUserId).not.toHaveBeenCalled();
    });

    it("ignores an inactive role's permissions", async () => {
      const user = buildUser();
      const activeRole = buildRole({
        id: 'role-active',
        status: RoleStatus.ACTIVE,
      });
      const inactiveRole = buildRole({
        id: 'role-inactive',
        status: RoleStatus.INACTIVE,
      });
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findRolesByUserId).mockResolvedValue([
        activeRole,
        inactiveRole,
      ]);
      vi.mocked(
        rolePermissionRepository.findPermissionsByRoleIds,
      ).mockResolvedValue([]);

      await expect(
        service.hasPermission(user.id, 'ticket.create'),
      ).resolves.toBe(false);
      expect(
        rolePermissionRepository.findPermissionsByRoleIds,
      ).toHaveBeenCalledWith([activeRole.id]);
    });

    it('ignores an inactive permission even if granted to an active role', async () => {
      const user = buildUser();
      const role = buildRole();
      const inactivePermission = buildPermission({
        code: 'ticket.create',
        status: PermissionStatus.INACTIVE,
      });
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findRolesByUserId).mockResolvedValue([role]);
      vi.mocked(
        rolePermissionRepository.findPermissionsByRoleIds,
      ).mockResolvedValue([inactivePermission]);

      await expect(
        service.hasPermission(user.id, 'ticket.create'),
      ).resolves.toBe(false);
    });

    it('returns false (does not throw) for a missing user', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(
        service.hasPermission('missing-user', 'ticket.create'),
      ).resolves.toBe(false);
    });

    it('propagates repository failures', async () => {
      const failure = new Error('db down');
      vi.mocked(userRepository.findById).mockRejectedValue(failure);

      await expect(
        service.hasPermission('user-1', 'ticket.create'),
      ).rejects.toBe(failure);
    });

    it('throws BadRequestException for an empty userId', async () => {
      await expect(service.hasPermission('', 'ticket.create')).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('resolves without throwing when the permission is granted', async () => {
      const user = buildUser();
      const role = buildRole();
      const permission = buildPermission({ code: 'ticket.create' });
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findRolesByUserId).mockResolvedValue([role]);
      vi.mocked(
        rolePermissionRepository.findPermissionsByRoleIds,
      ).mockResolvedValue([permission]);

      await expect(
        service.authorize(user.id, 'ticket.create'),
      ).resolves.toBeUndefined();
    });

    it('throws AuthorizationDeniedException when the permission is not granted', async () => {
      const user = buildUser();
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findRolesByUserId).mockResolvedValue([]);

      await expect(service.authorize(user.id, 'ticket.create')).rejects.toThrow(
        AuthorizationDeniedException,
      );
    });

    it('throws AuthorizationDeniedException for an inactive user', async () => {
      const user = buildUser({ status: UserStatus.SUSPENDED });
      vi.mocked(userRepository.findById).mockResolvedValue(user);

      await expect(service.authorize(user.id, 'ticket.create')).rejects.toThrow(
        AuthorizationDeniedException,
      );
    });

    it('throws AuthorizationDeniedException (a 403) for a missing user', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      const denial = service.authorize('missing-user', 'ticket.create');
      await expect(denial).rejects.toThrow(AuthorizationDeniedException);
      await expect(denial).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getUserPermissions', () => {
    it('combines permissions across multiple active roles', async () => {
      const user = buildUser();
      const roleA = buildRole({ id: 'role-a', code: 'ROLE_A' });
      const roleB = buildRole({ id: 'role-b', code: 'ROLE_B' });
      const permissionA = buildPermission({
        id: 'permission-a',
        code: 'ticket.create',
      });
      const permissionB = buildPermission({
        id: 'permission-b',
        code: 'ticket.delete',
      });
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findRolesByUserId).mockResolvedValue([
        roleA,
        roleB,
      ]);
      vi.mocked(
        rolePermissionRepository.findPermissionsByRoleIds,
      ).mockResolvedValue([permissionA, permissionB]);

      const result = await service.getUserPermissions(user.id);

      expect(
        rolePermissionRepository.findPermissionsByRoleIds,
      ).toHaveBeenCalledWith([roleA.id, roleB.id]);
      expect(result).toHaveLength(2);
      expect(result.map((permission) => permission.code).sort()).toEqual([
        'ticket.create',
        'ticket.delete',
      ]);
    });

    it('deduplicates when multiple roles grant the same permission', async () => {
      const user = buildUser();
      const roleA = buildRole({ id: 'role-a', code: 'ROLE_A' });
      const roleB = buildRole({ id: 'role-b', code: 'ROLE_B' });
      const sharedPermission = buildPermission({ code: 'ticket.create' });
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findRolesByUserId).mockResolvedValue([
        roleA,
        roleB,
      ]);
      // Both roles grant the same permission - the repository would return
      // it once per role in a naive join.
      vi.mocked(
        rolePermissionRepository.findPermissionsByRoleIds,
      ).mockResolvedValue([sharedPermission, sharedPermission]);

      const result = await service.getUserPermissions(user.id);

      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe('ticket.create');
    });

    it('returns an empty array for an inactive user', async () => {
      const user = buildUser({ status: UserStatus.INACTIVE });
      vi.mocked(userRepository.findById).mockResolvedValue(user);

      await expect(service.getUserPermissions(user.id)).resolves.toEqual([]);
      expect(userRoleRepository.findRolesByUserId).not.toHaveBeenCalled();
    });

    it('returns an empty array for a missing user', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(service.getUserPermissions('missing-user')).resolves.toEqual(
        [],
      );
    });
  });

  describe('getUserRoles', () => {
    it('returns only the active roles relevant to authorization', async () => {
      const user = buildUser();
      const activeRole = buildRole({
        id: 'role-active',
        status: RoleStatus.ACTIVE,
      });
      const inactiveRole = buildRole({
        id: 'role-inactive',
        status: RoleStatus.INACTIVE,
      });
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findRolesByUserId).mockResolvedValue([
        activeRole,
        inactiveRole,
      ]);

      const result = await service.getUserRoles(user.id);

      expect(result).toEqual([activeRole]);
    });

    it('returns an empty array for an inactive user', async () => {
      const user = buildUser({ status: UserStatus.INACTIVE });
      vi.mocked(userRepository.findById).mockResolvedValue(user);

      await expect(service.getUserRoles(user.id)).resolves.toEqual([]);
    });

    it('returns an empty array for a missing user', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(service.getUserRoles('missing-user')).resolves.toEqual([]);
    });
  });
});
