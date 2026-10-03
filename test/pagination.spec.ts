import { BadRequestException } from '@nestjs/common';
import { PermissionService, RoleService, UserService } from '../src';

describe('pagination validation (shared by all three search methods)', () => {
  const noRepository = {} as never;
  const searches = {
    users: (params: { page: number; pageSize: number }) =>
      new UserService(noRepository).searchUsers(params),
    roles: (params: { page: number; pageSize: number }) =>
      new RoleService(noRepository, noRepository, noRepository).searchRoles(
        params,
      ),
    permissions: (params: { page: number; pageSize: number }) =>
      new PermissionService(
        noRepository,
        noRepository,
        noRepository,
      ).searchPermissions(params),
  };

  describe.each(Object.entries(searches))('%s', (_name, search) => {
    it.each([
      { page: 0, pageSize: 10 },
      { page: 1.5, pageSize: 10 },
      { page: Number.NaN, pageSize: 10 },
      { page: 1, pageSize: 0 },
      { page: 1, pageSize: 2.5 },
      { page: 1, pageSize: -1 },
    ])('rejects %j with 400 before touching the repository', async (params) => {
      await expect(search(params)).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
