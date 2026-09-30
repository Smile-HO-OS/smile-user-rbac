import { BadRequestException } from '@nestjs/common';
import type { IUserRoleRepository } from '../../src/authorization/repositories/user-role-repository.interface';
import { RoleStatus } from '../../src/role/enums/role-status.enum';
import { DuplicateRoleException } from '../../src/role/exceptions/duplicate-role.exception';
import { RoleNotFoundException } from '../../src/role/exceptions/role-not-found.exception';
import type { IRole } from '../../src/role/interfaces/role.interface';
import type { IUserRole } from '../../src/role/interfaces/user-role.interface';
import type { IRoleRepository } from '../../src/role/repositories/role-repository.interface';
import { RoleService } from '../../src/role/role.service';
import { UserStatus } from '../../src/user/enums/user-status.enum';
import { UserNotFoundException } from '../../src/user/exceptions/user-not-found.exception';
import type { IUser } from '../../src/user/interfaces/user.interface';
import type { IUserRepository } from '../../src/user/repositories/user-repository.interface';

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

function buildUser(overrides: Partial<IUser> = {}): IUser {
  return {
    id: 'user-1',
    iamUserId: 'iam-1',
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildUserRole(overrides: Partial<IUserRole> = {}): IUserRole {
  return {
    id: 'user-role-1',
    userId: 'user-1',
    roleId: 'role-1',
    createdAt: new Date(),
    ...overrides,
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

function buildUserRoleRepositoryMock(): IUserRoleRepository {
  return {
    assign: vi.fn(),
    remove: vi.fn(),
    findRolesByUserId: vi.fn(),
    findAssignment: vi.fn(),
  };
}

function buildUserRepositoryMock(): IUserRepository {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByIamUserId: vi.fn(),
    search: vi.fn(),
  };
}

describe('RoleService', () => {
  let roleRepository: IRoleRepository;
  let userRoleRepository: IUserRoleRepository;
  let userRepository: IUserRepository;
  let service: RoleService;

  beforeEach(() => {
    roleRepository = buildRoleRepositoryMock();
    userRoleRepository = buildUserRoleRepositoryMock();
    userRepository = buildUserRepositoryMock();
    service = new RoleService(
      roleRepository,
      userRoleRepository,
      userRepository,
    );
  });

  describe('createRole', () => {
    it('creates a role when the code is not already taken', async () => {
      const role = buildRole();
      vi.mocked(roleRepository.findByCode).mockResolvedValue(null);
      vi.mocked(roleRepository.create).mockResolvedValue(role);

      const result = await service.createRole({
        name: role.name,
        code: role.code,
        description: role.description,
      });

      expect(roleRepository.findByCode).toHaveBeenCalledWith(role.code);
      expect(result).toEqual(role);
    });

    it('throws DuplicateRoleException when the code already exists', async () => {
      const role = buildRole();
      vi.mocked(roleRepository.findByCode).mockResolvedValue(role);

      await expect(
        service.createRole({
          name: role.name,
          code: role.code,
          description: role.description,
        }),
      ).rejects.toThrow(DuplicateRoleException);
      expect(roleRepository.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for a code with unsafe characters', async () => {
      await expect(
        service.createRole({
          name: 'Bad Role',
          code: 'not a valid code!',
          description: 'x',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRoleById', () => {
    it('returns the role when found', async () => {
      const role = buildRole();
      vi.mocked(roleRepository.findById).mockResolvedValue(role);

      await expect(service.getRoleById(role.id)).resolves.toEqual(role);
    });

    it('throws RoleNotFoundException when not found', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null);

      await expect(service.getRoleById('missing')).rejects.toThrow(
        RoleNotFoundException,
      );
    });
  });

  describe('getRoleByCode', () => {
    it('returns the role when found', async () => {
      const role = buildRole();
      vi.mocked(roleRepository.findByCode).mockResolvedValue(role);

      await expect(service.getRoleByCode(role.code)).resolves.toEqual(role);
    });

    it('throws RoleNotFoundException when not found', async () => {
      vi.mocked(roleRepository.findByCode).mockResolvedValue(null);

      await expect(service.getRoleByCode('MISSING')).rejects.toThrow(
        RoleNotFoundException,
      );
    });
  });

  describe('searchRoles', () => {
    it('delegates to the repository with valid pagination', async () => {
      const paginated = {
        items: [buildRole()],
        total: 1,
        page: 1,
        pageSize: 10,
      };
      vi.mocked(roleRepository.search).mockResolvedValue(paginated);

      const result = await service.searchRoles({ page: 1, pageSize: 10 });

      expect(roleRepository.search).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(paginated);
    });

    it('throws BadRequestException for a non-positive pageSize', async () => {
      await expect(
        service.searchRoles({ page: 1, pageSize: 0 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRole', () => {
    it('updates the role when the new code is unused', async () => {
      const role = buildRole();
      const updated = buildRole({ code: 'NEW_CODE' });
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(roleRepository.findByCode).mockResolvedValue(null);
      vi.mocked(roleRepository.update).mockResolvedValue(updated);

      const result = await service.updateRole(role.id, { code: 'NEW_CODE' });

      expect(roleRepository.update).toHaveBeenCalledWith(role.id, {
        code: 'NEW_CODE',
      });
      expect(result).toEqual(updated);
    });

    it('throws DuplicateRoleException when the new code belongs to another role', async () => {
      const role = buildRole();
      const otherRole = buildRole({ id: 'role-2', code: 'TAKEN' });
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(roleRepository.findByCode).mockResolvedValue(otherRole);

      await expect(
        service.updateRole(role.id, { code: 'TAKEN' }),
      ).rejects.toThrow(DuplicateRoleException);
      expect(roleRepository.update).not.toHaveBeenCalled();
    });

    it('throws RoleNotFoundException when the role does not exist', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null);

      await expect(
        service.updateRole('missing', { description: 'x' }),
      ).rejects.toThrow(RoleNotFoundException);
    });
  });

  describe('activateRole', () => {
    it('sets status to ACTIVE', async () => {
      const role = buildRole({ status: RoleStatus.INACTIVE });
      const activated = buildRole({ status: RoleStatus.ACTIVE });
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(roleRepository.update).mockResolvedValue(activated);

      await expect(service.activateRole(role.id)).resolves.toEqual(activated);
      expect(roleRepository.update).toHaveBeenCalledWith(role.id, {
        status: RoleStatus.ACTIVE,
      });
    });
  });

  describe('deactivateRole', () => {
    it('sets status to INACTIVE', async () => {
      const role = buildRole({ status: RoleStatus.ACTIVE });
      const deactivated = buildRole({ status: RoleStatus.INACTIVE });
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(roleRepository.update).mockResolvedValue(deactivated);

      await expect(service.deactivateRole(role.id)).resolves.toEqual(
        deactivated,
      );
    });
  });

  describe('assignRoleToUser', () => {
    it('assigns the role when the user has no existing assignment', async () => {
      const role = buildRole();
      const user = buildUser();
      const assignment = buildUserRole();
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findAssignment).mockResolvedValue(null);
      vi.mocked(userRoleRepository.assign).mockResolvedValue(assignment);

      const result = await service.assignRoleToUser(user.id, role.id);

      expect(userRoleRepository.assign).toHaveBeenCalledWith(user.id, role.id);
      expect(result).toEqual(assignment);
    });

    it('is idempotent: returns the existing assignment without reassigning', async () => {
      const role = buildRole();
      const user = buildUser();
      const assignment = buildUserRole();
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(userRepository.findById).mockResolvedValue(user);
      vi.mocked(userRoleRepository.findAssignment).mockResolvedValue(
        assignment,
      );

      const result = await service.assignRoleToUser(user.id, role.id);

      expect(userRoleRepository.assign).not.toHaveBeenCalled();
      expect(result).toEqual(assignment);
    });

    it('throws RoleNotFoundException when the role does not exist', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null);

      await expect(
        service.assignRoleToUser('user-1', 'missing-role'),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('throws BadRequestException when the role is not active', async () => {
      const role = buildRole({ status: RoleStatus.INACTIVE });
      vi.mocked(roleRepository.findById).mockResolvedValue(role);

      await expect(service.assignRoleToUser('user-1', role.id)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('throws UserNotFoundException when the user does not exist', async () => {
      const role = buildRole();
      vi.mocked(roleRepository.findById).mockResolvedValue(role);
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      await expect(
        service.assignRoleToUser('missing-user', role.id),
      ).rejects.toThrow(UserNotFoundException);
      expect(userRoleRepository.assign).not.toHaveBeenCalled();
    });
  });

  describe('removeRoleFromUser', () => {
    it('removes an existing assignment', async () => {
      const assignment = buildUserRole();
      vi.mocked(userRoleRepository.findAssignment).mockResolvedValue(
        assignment,
      );

      await service.removeRoleFromUser(assignment.userId, assignment.roleId);

      expect(userRoleRepository.remove).toHaveBeenCalledWith(
        assignment.userId,
        assignment.roleId,
      );
    });

    it('is a no-op when the role is not currently assigned', async () => {
      vi.mocked(userRoleRepository.findAssignment).mockResolvedValue(null);

      await service.removeRoleFromUser('user-1', 'role-1');

      expect(userRoleRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('getUserRoles', () => {
    it('returns the roles assigned to a user', async () => {
      const roles = [buildRole()];
      vi.mocked(userRoleRepository.findRolesByUserId).mockResolvedValue(roles);

      await expect(service.getUserRoles('user-1')).resolves.toEqual(roles);
    });
  });
});
