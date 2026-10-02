import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  AuthorizationService,
  IDENTITY_RESOLVER,
  PERMISSION_REPOSITORY,
  PermissionGuard,
  PermissionService,
  REQUIRED_PERMISSIONS_KEY,
  RequestIdentityResolver,
  ROLE_PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
  RoleService,
  USER_REPOSITORY,
  USER_ROLE_REPOSITORY,
  UserRbacModule,
  UserService,
  type IAuthenticatedIdentity,
  type IIdentityResolver,
} from '../src';

function repositoryProviders() {
  return {
    userRepositoryProvider: { provide: USER_REPOSITORY, useValue: {} },
    roleRepositoryProvider: { provide: ROLE_REPOSITORY, useValue: {} },
    permissionRepositoryProvider: {
      provide: PERMISSION_REPOSITORY,
      useValue: {},
    },
    userRoleRepositoryProvider: {
      provide: USER_ROLE_REPOSITORY,
      useValue: {},
    },
    rolePermissionRepositoryProvider: {
      provide: ROLE_PERMISSION_REPOSITORY,
      useValue: {},
    },
  };
}

describe('UserRbacModule', () => {
  it('wires User/Role/Permission services against app-supplied repository implementations', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UserRbacModule.forRoot(repositoryProviders())],
      providers: [Reflector],
    }).compile();

    expect(moduleRef.get(UserService)).toBeInstanceOf(UserService);
    expect(moduleRef.get(RoleService)).toBeInstanceOf(RoleService);
    expect(moduleRef.get(PermissionService)).toBeInstanceOf(PermissionService);
    expect(moduleRef.get(AuthorizationService)).toBeInstanceOf(
      AuthorizationService,
    );
  });

  it('defaults IDENTITY_RESOLVER to RequestIdentityResolver when no override is given', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UserRbacModule.forRoot(repositoryProviders())],
      providers: [Reflector],
    }).compile();

    expect(moduleRef.get(IDENTITY_RESOLVER)).toBeInstanceOf(
      RequestIdentityResolver,
    );
  });

  it('lets a consumer override IDENTITY_RESOLVER, and PermissionGuard actually uses the override (not the default)', async () => {
    @Injectable()
    class CustomIdentityResolver implements IIdentityResolver {
      resolve(): IAuthenticatedIdentity | undefined {
        return { iamUserId: 'resolved-by-custom-resolver' };
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        UserRbacModule.forRoot({
          ...repositoryProviders(),
          identityResolverProvider: {
            provide: IDENTITY_RESOLVER,
            useClass: CustomIdentityResolver,
          },
        }),
      ],
      providers: [Reflector],
    }).compile();

    expect(moduleRef.get(IDENTITY_RESOLVER)).toBeInstanceOf(
      CustomIdentityResolver,
    );

    // The real regression this guards against: a provider PermissionGuard's
    // own module (AuthorizationModule) declared locally would always win
    // over this override, so the only way to know the override truly
    // reaches the guard is to exercise canActivate() itself — reading
    // IDENTITY_RESOLVER off the module alone wouldn't have caught that bug.
    // Real decorator metadata (not a mocked Reflector): the Reflector that
    // PermissionGuard actually receives is Nest's own internal instance,
    // not whatever a test adds as its own root-level provider, so the only
    // reliable way to drive `getAllAndOverride` is to write real metadata
    // onto a real handler function.
    const handler = () => undefined;
    Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, ['x.read'], handler);

    const guard = moduleRef.get(PermissionGuard);
    const authorizationService = moduleRef.get(AuthorizationService);
    vi.spyOn(authorizationService, 'authorize').mockResolvedValue(undefined);
    const userService = moduleRef.get(UserService);
    vi.spyOn(userService, 'getUserByIamUserId').mockResolvedValue({
      id: 'resolved-by-custom-resolver',
    } as never);

    const context = {
      getHandler: () => handler,
      getClass: () => class Dummy {},
      switchToHttp: () => ({ getRequest: () => ({}) }),
    } as never;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(userService.getUserByIamUserId).toHaveBeenCalledWith(
      'resolved-by-custom-resolver',
    );
  });
});
