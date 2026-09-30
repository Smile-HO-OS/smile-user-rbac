import { BadRequestException } from '@nestjs/common';
import { UserStatus } from '../../src/user/enums/user-status.enum';
import { DuplicateUserException } from '../../src/user/exceptions/duplicate-user.exception';
import { UserNotFoundException } from '../../src/user/exceptions/user-not-found.exception';
import type { IUser } from '../../src/user/interfaces/user.interface';
import type { IUserRepository } from '../../src/user/repositories/user-repository.interface';
import { UserService } from '../../src/user/user.service';

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

function buildRepositoryMock(): IUserRepository {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByIamUserId: vi.fn(),
    search: vi.fn(),
  };
}

describe('UserService', () => {
  let repository: IUserRepository;
  let service: UserService;

  beforeEach(() => {
    repository = buildRepositoryMock();
    service = new UserService(repository);
  });

  describe('createUser', () => {
    it('creates a user when the iamUserId is not already taken', async () => {
      const user = buildUser();
      vi.mocked(repository.findByIamUserId).mockResolvedValue(null);
      vi.mocked(repository.create).mockResolvedValue(user);

      const result = await service.createUser({ iamUserId: user.iamUserId });

      expect(repository.findByIamUserId).toHaveBeenCalledWith(user.iamUserId);
      expect(repository.create).toHaveBeenCalledWith({
        iamUserId: user.iamUserId,
      });
      expect(result).toEqual(user);
    });

    it('throws DuplicateUserException when the iamUserId already exists', async () => {
      const user = buildUser();
      vi.mocked(repository.findByIamUserId).mockResolvedValue(user);

      await expect(
        service.createUser({ iamUserId: user.iamUserId }),
      ).rejects.toThrow(DuplicateUserException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when iamUserId is missing', async () => {
      await expect(service.createUser({ iamUserId: '' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findByIamUserId).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('returns the user when found', async () => {
      const user = buildUser();
      vi.mocked(repository.findById).mockResolvedValue(user);

      await expect(service.getUserById(user.id)).resolves.toEqual(user);
    });

    it('throws UserNotFoundException when not found', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(service.getUserById('missing')).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('getUserByIamUserId', () => {
    it('returns the user when found', async () => {
      const user = buildUser();
      vi.mocked(repository.findByIamUserId).mockResolvedValue(user);

      await expect(service.getUserByIamUserId(user.iamUserId)).resolves.toEqual(
        user,
      );
    });

    it('throws UserNotFoundException when not found', async () => {
      vi.mocked(repository.findByIamUserId).mockResolvedValue(null);

      await expect(service.getUserByIamUserId('missing')).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('searchUsers', () => {
    it('delegates to the repository with valid pagination', async () => {
      const paginated = {
        items: [buildUser()],
        total: 1,
        page: 1,
        pageSize: 10,
      };
      vi.mocked(repository.search).mockResolvedValue(paginated);

      const result = await service.searchUsers({ page: 1, pageSize: 10 });

      expect(repository.search).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
      });
      expect(result).toEqual(paginated);
    });

    it('throws BadRequestException for a non-positive page', async () => {
      await expect(
        service.searchUsers({ page: 0, pageSize: 10 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateUser', () => {
    it('updates the user after confirming it exists', async () => {
      const user = buildUser();
      const updated = buildUser({ status: UserStatus.SUSPENDED });
      vi.mocked(repository.findById).mockResolvedValue(user);
      vi.mocked(repository.update).mockResolvedValue(updated);

      const result = await service.updateUser(user.id, {
        status: UserStatus.SUSPENDED,
      });

      expect(repository.update).toHaveBeenCalledWith(user.id, {
        status: UserStatus.SUSPENDED,
      });
      expect(result).toEqual(updated);
    });

    it('throws UserNotFoundException when the user does not exist', async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      await expect(
        service.updateUser('missing', { status: UserStatus.ACTIVE }),
      ).rejects.toThrow(UserNotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('activateUser', () => {
    it('sets status to ACTIVE', async () => {
      const user = buildUser({ status: UserStatus.INACTIVE });
      const activated = buildUser({ status: UserStatus.ACTIVE });
      vi.mocked(repository.findById).mockResolvedValue(user);
      vi.mocked(repository.update).mockResolvedValue(activated);

      const result = await service.activateUser(user.id);

      expect(repository.update).toHaveBeenCalledWith(user.id, {
        status: UserStatus.ACTIVE,
      });
      expect(result).toEqual(activated);
    });
  });

  describe('deactivateUser', () => {
    it('sets status to INACTIVE', async () => {
      const user = buildUser({ status: UserStatus.ACTIVE });
      const deactivated = buildUser({ status: UserStatus.INACTIVE });
      vi.mocked(repository.findById).mockResolvedValue(user);
      vi.mocked(repository.update).mockResolvedValue(deactivated);

      const result = await service.deactivateUser(user.id);

      expect(repository.update).toHaveBeenCalledWith(user.id, {
        status: UserStatus.INACTIVE,
      });
      expect(result).toEqual(deactivated);
    });
  });
});
