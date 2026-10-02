import {
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthorizationDeniedException,
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
import type { IRole } from '../../src';

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
    authorize: vi.fn().mockResolvedValue(undefined),
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
    authorizationService,
    userService,
    permissionGuard: new PermissionGuard(...args),
    roleGuard: new RoleGuard(...args),
  };
}

const roles = (...codes: string[]) =>
  codes.map((code) => ({ code })) as unknown as IRole[];

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
  it('allows and delegates to AuthorizationService using the local user id', async () => {
    const { permissionGuard, authorizationService, userService } = build();

    await expect(
      permissionGuard.canActivate(
        buildContext(proto.single, { subjectId: 'iam-1' }),
      ),
    ).resolves.toBe(true);
    expect(userService.getUserBySubjectId).toHaveBeenCalledWith('iam-1');
    expect(authorizationService.authorize).toHaveBeenCalledWith(
      'user-1',
      'ticket.create',
    );
  });

  it('denies with 403 when authorization is denied', async () => {
    const { permissionGuard, authorizationService } = build();
    authorizationService.authorize.mockRejectedValue(
      new AuthorizationDeniedException('user-1', 'ticket.create', 'nope'),
    );

    await expect(
      permissionGuard.canActivate(
        buildContext(proto.single, { subjectId: 'iam-1' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires ALL permissions when several are listed', async () => {
    const { permissionGuard, authorizationService } = build();
    authorizationService.authorize.mockImplementation((_id, code: string) =>
      code === 'ticket.close'
        ? Promise.reject(new AuthorizationDeniedException('user-1', code, 'x'))
        : Promise.resolve(),
    );

    await expect(
      permissionGuard.canActivate(
        buildContext(proto.multiple, { subjectId: 'iam-1' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(authorizationService.authorize).toHaveBeenCalledTimes(2);
  });

  it('allows when every listed permission is granted', async () => {
    const { permissionGuard, authorizationService } = build();

    await expect(
      permissionGuard.canActivate(
        buildContext(proto.multiple, { subjectId: 'iam-1' }),
      ),
    ).resolves.toBe(true);
    expect(authorizationService.authorize).toHaveBeenCalledTimes(2);
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

  it('denies with 403 when the identity has no local user', async () => {
    const { permissionGuard, userService } = build();
    userService.getUserBySubjectId.mockRejectedValue(
      new UserNotFoundException('iam-1'),
    );

    await expect(
      permissionGuard.canActivate(
        buildContext(proto.single, { subjectId: 'iam-1' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('propagates unexpected errors instead of masking them as 403', async () => {
    const { permissionGuard, authorizationService } = build();
    const failure = new Error('db down');
    authorizationService.authorize.mockRejectedValue(failure);

    await expect(
      permissionGuard.canActivate(
        buildContext(proto.single, { subjectId: 'iam-1' }),
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
      roleGuard.canActivate(buildContext(proto.role, { subjectId: 'iam-1' })),
    ).resolves.toBe(true);
    expect(authorizationService.getUserRoles).toHaveBeenCalledWith('user-1');
  });

  it('denies with 403 when the role is missing', async () => {
    const { roleGuard, authorizationService } = build();
    authorizationService.getUserRoles.mockResolvedValue(roles('other'));

    await expect(
      roleGuard.canActivate(buildContext(proto.role, { subjectId: 'iam-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires ALL roles when several are listed', async () => {
    const { roleGuard, authorizationService } = build();
    authorizationService.getUserRoles.mockResolvedValue(
      roles('support_manager'),
    );
    await expect(
      roleGuard.canActivate(buildContext(proto.roles, { subjectId: 'iam-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);

    authorizationService.getUserRoles.mockResolvedValue(
      roles('support_manager', 'auditor'),
    );
    await expect(
      roleGuard.canActivate(buildContext(proto.roles, { subjectId: 'iam-1' })),
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
      new UserNotFoundException('iam-1'),
    );

    await expect(
      roleGuard.canActivate(buildContext(proto.role, { subjectId: 'iam-1' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('propagates unexpected errors', async () => {
    const { roleGuard, authorizationService } = build();
    const failure = new Error('db down');
    authorizationService.getUserRoles.mockRejectedValue(failure);

    await expect(
      roleGuard.canActivate(buildContext(proto.role, { subjectId: 'iam-1' })),
    ).rejects.toBe(failure);
  });
});
