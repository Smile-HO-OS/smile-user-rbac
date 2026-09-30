import { Test } from '@nestjs/testing';
import {
  AuthorizationService,
  PERMISSION_REPOSITORY,
  PermissionService,
  ROLE_PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
  RoleService,
  USER_REPOSITORY,
  USER_ROLE_REPOSITORY,
  UserRbacModule,
  UserService,
} from '../src';

describe('UserRbacModule', () => {
  it('wires User/Role/Permission services against app-supplied repository implementations', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        UserRbacModule.forRoot({
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
        }),
      ],
    }).compile();

    expect(moduleRef.get(UserService)).toBeInstanceOf(UserService);
    expect(moduleRef.get(RoleService)).toBeInstanceOf(RoleService);
    expect(moduleRef.get(PermissionService)).toBeInstanceOf(PermissionService);
    expect(moduleRef.get(AuthorizationService)).toBeInstanceOf(
      AuthorizationService,
    );
  });
});
