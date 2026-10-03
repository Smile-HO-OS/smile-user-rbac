import {
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthorizationService,
  PermissionGuard,
  REQUIRED_PERMISSIONS_KEY,
  REQUIRED_ROLES_KEY,
  RequestIdentityResolver,
  RequirePermission,
  RequireRole,
  RoleGuard,
  UserNotFoundException,
  UserService,
} from '../../src';
import type { IPermission, IRole } from '../../src';

@Controller()
class TestController {
  @Get('a')
  @RequirePermission('ticket.create')
  single() {}

  @Get('b')
  @RequirePermission('ticket.create', 'ticket.close')
  multiple() {}

  @Get('c')
  @RequireRole('support_manager')
  role() {}

  @Get('d')
  @RequireRole('support_manager', 'auditor')
  roles() {}

  @Get('e')
  open() {}
}

function buildContext(
  handler: () => void,
  user?: { subjectId?: unknown },
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => TestController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

const proto = TestController.prototype;
const reflector = new Reflector();

function build() {
  const authorizationService = {
    getUserPermissions: vi.fn().mockResolvedValue([]),
    getUserRoles: vi.fn().mockResolvedValue([]),
  };
  const userService = {
    getUserBySubjectId: vi.fn().mockResolvedValue({ id: 'user-1' }),
  };
  const resolver = new RequestIdentityResolver();
  const args = [
    reflector,
    resolver,
    userService as unknown as UserService,
    authorizationService as unknown as AuthorizationService,
  ] as const;
  return {
    reflector,
    authorizationService,
    userService,
    permissionGuard: new PermissionGuard(...args),
    roleGuard: new RoleGuard(...args),
  };
}

const roles = (...codes: string[]) =>
  codes.map((code) => ({ code })) as unknown as IRole[];
const permissions = (...codes: string[]) =>
  codes.map((code) => ({ code })) as unknown as IPermission[];

describe('decorators', () => {
  it('store required codes as metadata', () => {
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, proto.multiple),
    ).toEqual(['ticket.create', 'ticket.close']);
    expect(Reflect.getMetadata(REQUIRED_ROLES_KEY, proto.role)).toEqual([
      'support_manager',
    ]);
  });
});

describe('PermissionGuard', () => {
  it('allows and checks against the local user id, not the subjectId', async () => {
    const { permissionGuard, authorizationService, userService } = build();
    authorizationService.getUserPermissions.mockResolvedValue(
      permissions('ticket.create'),
    );

    await expect(
      permissionGuard.canActivate(
        buildContext(proto.single, { subjectId: 'subject-1' }),
      ),
    ).resolves.toBe(true);
    expect(userService.getUserBySubjectId).toHaveBeenCalledWith('subject-1');
    expect(authorizationService.getUserPermissions).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('denies with 403 when the permission is not held', async () => {
    const { permissionGuard, authorizationService } = build();
    authorizationService.getUserPermissions.mockResolvedValue(
      permissions('other.permission'),
    );

    await expect(
      permissionGuard.canActivate(
        buildContext(proto.single, { subjectId: 'subject-1' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires ALL permissions when several are listed, loading them once', async () => {
    const { permissionGuard, authorizationService } = build();
    authorizationService.getUserPermissions.mockResolvedValue(
      permissions('ticket.create'),
    );
    await expect(
      permissionGuard.canActivate(
        buildContext(proto.multiple, { subjectId: 'subject-1' }),
      ),
    ).rejects.toThrow('ticket.close');

    authorizationService.getUserPermissions.mockClear();
    authorizationService.getUserPermissions.mockResolvedValue(
      permissions('ticket.create', 'ticket.close'),
    );
    await expect(
      permissionGuard.canActivate(
        buildContext(proto.multiple, { subjectId: 'subject-1' }),
      ),
    ).resolves.toBe(true);
    expect(authorizationService.getUserPermissions).toHaveBeenCalledTimes(1);
  });

  it.each([undefined, {}, { subjectId: '' }, { subjectId: 42 }])(
    'rejects missing identity with 401 (%j)',
    async (user) => {
      const { permissionGuard, userService } = build();

      await expect(
        permissionGuard.canActivate(buildContext(proto.single, user)),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(userService.getUserBySubjectId).not.toHaveBeenCalled();
    },
  );

  it.each(['', '   ', null, undefined])(
    'rejects a custom resolver that yields a blank identity (%j) with 401, not 400',
    async (subjectId) => {
      const { reflector: r, userService, authorizationService } = build();
      const resolver = {
        resolve: () => (subjectId === undefined ? undefined : { subjectId }),
      };
      const guard = new PermissionGuard(
        r,
        resolver as never,
        userService as unknown as UserService,
        authorizationService as unknown as AuthorizationService,
      );

      await expect(
        guard.canActivate(buildContext(proto.single)),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(userService.getUserBySubjectId).not.toHaveBeenCalled();
    },
  );

  it('denies with 403 when the identity has no local user', async () => {
    const { permissionGuard, userService } = build();
    userService.getUserBySubjectId.mockRejectedValue(
      new UserNotFoundException('subject-1'),
    );

    await expect(
      permissionGuard.canActivate(
        buildContext(proto.single, { subjectId: 'subject-1' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('propagates unexpected errors instead of masking them as 403', async () => {
    const { permissionGuard, authorizationService } = build();
    const failure = new Error('db down');
    authorizationService.getUserPermissions.mockRejectedValue(failure);

    await expect(
      permissionGuard.canActivate(
        buildContext(proto.single, { subjectId: 'subject-1' }),
      ),
    ).rejects.toBe(failure);
  });

  it('passes through routes with no requirement', async () => {
    const { permissionGuard, userService } = build();

    await expect(
      permissionGuard.canActivate(buildContext(proto.open)),
    ).resolves.toBe(true);
    expect(userService.getUserBySubjectId).not.toHaveBeenCalled();
  });
});

describe('RoleGuard', () => {
  it('allows when the user holds the role', async () => {
    const { roleGuard, authorizationService } = build();
    authorizationService.getUserRoles.mockResolvedValue(
      roles('support_manager'),
    );

    await expect(
      roleGuard.canActivate(
        buildContext(proto.role, { subjectId: 'subject-1' }),
      ),
    ).resolves.toBe(true);
    expect(authorizationService.getUserRoles).toHaveBeenCalledWith('user-1');
  });

  it('denies with 403 when the role is missing', async () => {
    const { roleGuard, authorizationService } = build();
    authorizationService.getUserRoles.mockResolvedValue(roles('other'));

    await expect(
      roleGuard.canActivate(
        buildContext(proto.role, { subjectId: 'subject-1' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires ALL roles when several are listed', async () => {
    const { roleGuard, authorizationService } = build();
    authorizationService.getUserRoles.mockResolvedValue(
      roles('support_manager'),
    );
    await expect(
      roleGuard.canActivate(
        buildContext(proto.roles, { subjectId: 'subject-1' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    authorizationService.getUserRoles.mockResolvedValue(
      roles('support_manager', 'auditor'),
    );
    await expect(
      roleGuard.canActivate(
        buildContext(proto.roles, { subjectId: 'subject-1' }),
      ),
    ).resolves.toBe(true);
  });

  it('rejects missing identity with 401', async () => {
    const { roleGuard } = build();

    await expect(
      roleGuard.canActivate(buildContext(proto.role)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('denies with 403 when the identity has no local user', async () => {
    const { roleGuard, userService } = build();
    userService.getUserBySubjectId.mockRejectedValue(
      new UserNotFoundException('subject-1'),
    );

    await expect(
      roleGuard.canActivate(
        buildContext(proto.role, { subjectId: 'subject-1' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('propagates unexpected errors', async () => {
    const { roleGuard, authorizationService } = build();
    const failure = new Error('db down');
    authorizationService.getUserRoles.mockRejectedValue(failure);

    await expect(
      roleGuard.canActivate(
        buildContext(proto.role, { subjectId: 'subject-1' }),
      ),
    ).rejects.toBe(failure);
  });
});
