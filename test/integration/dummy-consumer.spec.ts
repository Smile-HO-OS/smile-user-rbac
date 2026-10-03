import {
  Controller,
  ExecutionContext,
  Get,
  MiddlewareConsumer,
  Module,
  type NestMiddleware,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
  RequirePermission,
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

  create(input: { subjectId: string; status?: UserStatus }): Promise<IUser> {
    const row: IUser = {
      id: randomUUID(),
      subjectId: input.subjectId,
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

  findBySubjectId(subjectId: string): Promise<IUser | null> {
    return Promise.resolve(
      [...this.rows.values()].find((u) => u.subjectId === subjectId) ?? null,
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

function buildGuardContext(subjectId: string): ExecutionContext {
  const handler = () => undefined;
  Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, ['ticket.create'], handler);
  return {
    getHandler: () => handler,
    getClass: () => class DummyController {},
    switchToHttp: () => ({ getRequest: () => ({ user: { subjectId } }) }),
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

    const user = await userService.createUser({ subjectId: 'subject-1' });
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
      permissionGuard.canActivate(buildGuardContext('subject-1')),
    ).resolves.toBe(true);
    await expect(
      permissionGuard.canActivate(buildGuardContext('subject-unassigned')),
    ).rejects.toBeTruthy();
  });

  it('works wired the way the README says: an app RbacModule re-exporting forRoot(), plus APP_GUARD', async () => {
    const roleRepository = new InMemoryRoleRepository();
    const permissionRepository = new InMemoryPermissionRepository();

    @Module({
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
      exports: [UserRbacModule],
    })
    class RbacModule {}

    @Module({
      imports: [RbacModule],
      providers: [{ provide: APP_GUARD, useClass: PermissionGuard }],
    })
    class AppModule {}

    // Compiling proves PermissionGuard's dependencies (UserService,
    // AuthorizationService, IDENTITY_RESOLVER, Reflector) all resolve when
    // the guard is registered in the consumer's own module.
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const userService = moduleRef.get(UserService, { strict: false });
    const roleService = moduleRef.get(RoleService, { strict: false });
    const permissionService = moduleRef.get(PermissionService, {
      strict: false,
    });
    const authorizationService = moduleRef.get(AuthorizationService, {
      strict: false,
    });

    const user = await userService.createUser({ subjectId: 'subject-multi' });
    const [roleA, roleB, inactiveRole] = await Promise.all(
      ['role_a', 'role_b', 'role_c'].map((code) =>
        roleService.createRole({ name: code, code, description: '' }),
      ),
    );
    const make = (code: string) =>
      permissionService.createPermission({
        code,
        resource: 'ticket',
        action: PermissionAction.CREATE,
        description: '',
      });
    const [shared, onlyA, onlyB, viaInactiveRole] = await Promise.all([
      make('ticket.shared'),
      make('ticket.only_a'),
      make('ticket.only_b'),
      make('ticket.via_inactive_role'),
    ]);

    for (const role of [roleA, roleB, inactiveRole]) {
      await roleService.assignRoleToUser(user.id, role.id);
    }
    await permissionService.assignPermissionToRole(roleA.id, shared.id);
    await permissionService.assignPermissionToRole(roleA.id, onlyA.id);
    await permissionService.assignPermissionToRole(roleB.id, shared.id);
    await permissionService.assignPermissionToRole(roleB.id, onlyB.id);
    await permissionService.assignPermissionToRole(
      inactiveRole.id,
      viaInactiveRole.id,
    );
    await roleService.deactivateRole(inactiveRole.id);

    // Multiple roles merge; the permission both roles grant appears once.
    const codes = (await authorizationService.getUserPermissions(user.id))
      .map((permission) => permission.code)
      .sort();
    expect(codes).toEqual(['ticket.only_a', 'ticket.only_b', 'ticket.shared']);

    // An inactive role grants nothing; deactivating the user revokes all.
    await expect(
      authorizationService.hasPermission(user.id, 'ticket.via_inactive_role'),
    ).resolves.toBe(false);
    await userService.deactivateUser(user.id);
    await expect(
      authorizationService.hasPermission(user.id, 'ticket.shared'),
    ).resolves.toBe(false);
  });

  it('over real HTTP: 401 without identity, 403 for unknown or unauthorized callers, 200 when granted, 500 on repository failure', async () => {
    const userRepository = new InMemoryUserRepository();
    const roleRepository = new InMemoryRoleRepository();
    const permissionRepository = new InMemoryPermissionRepository();

    // The app's own authentication stand-in: trusts an `x-subject` header.
    class FakeAuthMiddleware implements NestMiddleware {
      use(
        req: { headers: Record<string, string>; user?: unknown },
        _res: unknown,
        next: () => void,
      ) {
        const subjectId = req.headers['x-subject'];
        if (subjectId) req.user = { subjectId };
        next();
      }
    }

    @Controller('tickets')
    class TicketsController {
      @Get()
      @RequirePermission('ticket.create')
      list() {
        return { ok: true };
      }
    }

    @Module({
      imports: [
        UserRbacModule.forRoot({
          userRepositoryProvider: {
            provide: USER_REPOSITORY,
            useValue: userRepository,
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
      controllers: [TicketsController],
      providers: [{ provide: APP_GUARD, useClass: PermissionGuard }],
    })
    class AppModule {
      configure(consumer: MiddlewareConsumer) {
        consumer.apply(FakeAuthMiddleware).forRoutes('*');
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0);
    try {
      const base = await app.getUrl();
      const call = (subject?: string) =>
        fetch(`${base}/tickets`, {
          headers: subject ? { 'x-subject': subject } : {},
        }).then((res) => res.status);

      const userService = moduleRef.get(UserService);
      const roleService = moduleRef.get(RoleService);
      const permissionService = moduleRef.get(PermissionService);
      const granted = await userService.createUser({ subjectId: 'granted' });
      await userService.createUser({ subjectId: 'ungranted' });
      const role = await roleService.createRole({
        name: 'Agent',
        code: 'agent',
        description: '',
      });
      const permission = await permissionService.createPermission({
        code: 'ticket.create',
        resource: 'ticket',
        action: PermissionAction.CREATE,
        description: '',
      });
      await roleService.assignRoleToUser(granted.id, role.id);
      await permissionService.assignPermissionToRole(role.id, permission.id);

      await expect(call()).resolves.toBe(401);
      await expect(call('no-local-user')).resolves.toBe(403);
      await expect(call('ungranted')).resolves.toBe(403);
      await expect(call('granted')).resolves.toBe(200);

      vi.spyOn(userRepository, 'findBySubjectId').mockRejectedValue(
        new Error('db down'),
      );
      await expect(call('granted')).resolves.toBe(500);
    } finally {
      await app.close();
    }
  });
});
