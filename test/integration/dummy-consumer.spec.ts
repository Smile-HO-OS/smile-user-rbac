import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import {
  AuthorizationService,
  IPaginatedResult,
  IPaginationParams,
  IPermission,
  IRole,
  IRolePermission,
  IUser,
  IUserRole,
  PERMISSION_REPOSITORY,
  PermissionAction,
  PermissionGuard,
  PermissionService,
  PermissionStatus,
  REQUIRED_PERMISSIONS_KEY,
  ROLE_PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
  RoleService,
  RoleStatus,
  USER_REPOSITORY,
  USER_ROLE_REPOSITORY,
  UserRbacModule,
  UserService,
  UserStatus,
} from '../../src';

/**
 * Stands in for an application's own database layer. Every repository below
 * implements only the package's interfaces and holds no RBAC behaviour of
 * its own, mirroring how a real consumer (e.g. a Prisma-backed repository)
 * would be written.
 */
class InMemoryUserRepository {
  private readonly rows = new Map<string, IUser>();

  findById(id: string): Promise<IUser | null> {
    return Promise.resolve(this.rows.get(id) ?? null);
  }

  create(input: { iamUserId: string; status?: UserStatus }): Promise<IUser> {
    const row: IUser = {
      id: randomUUID(),
      iamUserId: input.iamUserId,
      status: input.status ?? UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rows.set(row.id, row);
    return Promise.resolve(row);
  }

  update(id: string, input: { status?: UserStatus }): Promise<IUser> {
    const updated = { ...this.rows.get(id)!, ...input, updatedAt: new Date() };
    this.rows.set(id, updated);
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.rows.delete(id);
    return Promise.resolve();
  }

  findByIamUserId(iamUserId: string): Promise<IUser | null> {
    return Promise.resolve(
      [...this.rows.values()].find((u) => u.iamUserId === iamUserId) ?? null,
    );
  }

  search(params: IPaginationParams): Promise<IPaginatedResult<IUser>> {
    const items = [...this.rows.values()];
    return Promise.resolve({
      items,
      total: items.length,
      page: params.page,
      pageSize: params.pageSize,
    });
  }
}

class InMemoryRoleRepository {
  readonly rows = new Map<string, IRole>();

  findById(id: string): Promise<IRole | null> {
    return Promise.resolve(this.rows.get(id) ?? null);
  }

  create(input: {
    name: string;
    code: string;
    description: string;
  }): Promise<IRole> {
    const row: IRole = {
      id: randomUUID(),
      name: input.name,
      code: input.code,
      description: input.description,
      status: RoleStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rows.set(row.id, row);
    return Promise.resolve(row);
  }

  update(id: string, input: Partial<IRole>): Promise<IRole> {
    const updated = { ...this.rows.get(id)!, ...input, updatedAt: new Date() };
    this.rows.set(id, updated);
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.rows.delete(id);
    return Promise.resolve();
  }

  findByCode(code: string): Promise<IRole | null> {
    return Promise.resolve(
      [...this.rows.values()].find((r) => r.code === code) ?? null,
    );
  }

  search(params: IPaginationParams): Promise<IPaginatedResult<IRole>> {
    const items = [...this.rows.values()];
    return Promise.resolve({
      items,
      total: items.length,
      page: params.page,
      pageSize: params.pageSize,
    });
  }
}

class InMemoryPermissionRepository {
  readonly rows = new Map<string, IPermission>();

  findById(id: string): Promise<IPermission | null> {
    return Promise.resolve(this.rows.get(id) ?? null);
  }

  create(input: {
    code: string;
    resource: string;
    action: PermissionAction;
    description: string;
  }): Promise<IPermission> {
    const row: IPermission = {
      id: randomUUID(),
      code: input.code,
      resource: input.resource,
      action: input.action,
      description: input.description,
      status: PermissionStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rows.set(row.id, row);
    return Promise.resolve(row);
  }

  update(id: string, input: Partial<IPermission>): Promise<IPermission> {
    const updated = { ...this.rows.get(id)!, ...input, updatedAt: new Date() };
    this.rows.set(id, updated);
    return Promise.resolve(updated);
  }

  delete(id: string): Promise<void> {
    this.rows.delete(id);
    return Promise.resolve();
  }

  findByCode(code: string): Promise<IPermission | null> {
    return Promise.resolve(
      [...this.rows.values()].find((p) => p.code === code) ?? null,
    );
  }

  search(params: IPaginationParams): Promise<IPaginatedResult<IPermission>> {
    const items = [...this.rows.values()];
    return Promise.resolve({
      items,
      total: items.length,
      page: params.page,
      pageSize: params.pageSize,
    });
  }
}

class InMemoryUserRoleRepository {
  private readonly rows: IUserRole[] = [];

  constructor(private readonly roleRepository: InMemoryRoleRepository) {}

  assign(userId: string, roleId: string): Promise<IUserRole> {
    const row: IUserRole = {
      id: randomUUID(),
      userId,
      roleId,
      createdAt: new Date(),
    };
    this.rows.push(row);
    return Promise.resolve(row);
  }

  remove(userId: string, roleId: string): Promise<void> {
    const idx = this.rows.findIndex(
      (r) => r.userId === userId && r.roleId === roleId,
    );
    if (idx >= 0) this.rows.splice(idx, 1);
    return Promise.resolve();
  }

  findAssignment(userId: string, roleId: string): Promise<IUserRole | null> {
    return Promise.resolve(
      this.rows.find((r) => r.userId === userId && r.roleId === roleId) ?? null,
    );
  }

  findRolesByUserId(userId: string): Promise<IRole[]> {
    const roleIds = this.rows
      .filter((r) => r.userId === userId)
      .map((r) => r.roleId);
    return Promise.resolve(
      [...this.roleRepository.rows.values()].filter((role) =>
        roleIds.includes(role.id),
      ),
    );
  }
}

class InMemoryRolePermissionRepository {
  private readonly rows: IRolePermission[] = [];

  constructor(
    private readonly permissionRepository: InMemoryPermissionRepository,
  ) {}

  assign(roleId: string, permissionId: string): Promise<IRolePermission> {
    const row: IRolePermission = {
      id: randomUUID(),
      roleId,
      permissionId,
      createdAt: new Date(),
    };
    this.rows.push(row);
    return Promise.resolve(row);
  }

  remove(roleId: string, permissionId: string): Promise<void> {
    const idx = this.rows.findIndex(
      (r) => r.roleId === roleId && r.permissionId === permissionId,
    );
    if (idx >= 0) this.rows.splice(idx, 1);
    return Promise.resolve();
  }

  findAssignment(
    roleId: string,
    permissionId: string,
  ): Promise<IRolePermission | null> {
    return Promise.resolve(
      this.rows.find(
        (r) => r.roleId === roleId && r.permissionId === permissionId,
      ) ?? null,
    );
  }

  findPermissionsByRoleId(roleId: string): Promise<IPermission[]> {
    return this.findPermissionsByRoleIds([roleId]);
  }

  findPermissionsByRoleIds(roleIds: string[]): Promise<IPermission[]> {
    const permissionIds = this.rows
      .filter((r) => roleIds.includes(r.roleId))
      .map((r) => r.permissionId);
    return Promise.resolve(
      [...this.permissionRepository.rows.values()].filter((permission) =>
        permissionIds.includes(permission.id),
      ),
    );
  }
}

function buildGuardContext(iamUserId: string): ExecutionContext {
  const handler = () => undefined;
  Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, ['ticket.create'], handler);
  return {
    getHandler: () => handler,
    getClass: () => class DummyController {},
    switchToHttp: () => ({ getRequest: () => ({ user: { iamUserId } }) }),
  } as unknown as ExecutionContext;
}

/**
 * Proves the intended architecture end to end with an application that
 * supplies only in-memory repositories (standing in for Prisma/PostgreSQL):
 * Consumer App -> @shree-maruti/user-rbac -> Consumer Repositories -> Consumer DB.
 */
describe('Dummy consuming application (in-memory repositories)', () => {
  it('creates users/roles/permissions, assigns them, and enforces @RequirePermission()', async () => {
    const roleRepository = new InMemoryRoleRepository();
    const permissionRepository = new InMemoryPermissionRepository();

    const moduleRef = await Test.createTestingModule({
      imports: [
        UserRbacModule.forRoot({
          userRepositoryProvider: {
            provide: USER_REPOSITORY,
            useClass: InMemoryUserRepository,
          },
          roleRepositoryProvider: {
            provide: ROLE_REPOSITORY,
            useValue: roleRepository,
          },
          permissionRepositoryProvider: {
            provide: PERMISSION_REPOSITORY,
            useValue: permissionRepository,
          },
          userRoleRepositoryProvider: {
            provide: USER_ROLE_REPOSITORY,
            useValue: new InMemoryUserRoleRepository(roleRepository),
          },
          rolePermissionRepositoryProvider: {
            provide: ROLE_PERMISSION_REPOSITORY,
            useValue: new InMemoryRolePermissionRepository(
              permissionRepository,
            ),
          },
        }),
      ],
    }).compile();

    const userService = moduleRef.get(UserService);
    const roleService = moduleRef.get(RoleService);
    const permissionService = moduleRef.get(PermissionService);
    const authorizationService = moduleRef.get(AuthorizationService);
    const permissionGuard = moduleRef.get(PermissionGuard);

    const user = await userService.createUser({ iamUserId: 'iam-user-1' });
    const role = await roleService.createRole({
      name: 'Booking Admin',
      code: 'booking_admin',
      description: 'Manages bookings',
    });
    const permission = await permissionService.createPermission({
      code: 'ticket.create',
      resource: 'ticket',
      action: PermissionAction.CREATE,
      description: 'Create tickets',
    });

    await roleService.assignRoleToUser(user.id, role.id);
    await permissionService.assignPermissionToRole(role.id, permission.id);

    await expect(
      authorizationService.hasPermission(user.id, 'ticket.create'),
    ).resolves.toBe(true);
    await expect(
      authorizationService.hasPermission(user.id, 'ticket.delete'),
    ).resolves.toBe(false);

    await expect(
      permissionGuard.canActivate(buildGuardContext('iam-user-1')),
    ).resolves.toBe(true);
    await expect(
      permissionGuard.canActivate(buildGuardContext('iam-user-unassigned')),
    ).rejects.toBeTruthy();
  });
});
