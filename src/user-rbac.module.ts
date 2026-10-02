import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AuthorizationModule } from './authorization';
import { PermissionModule } from './permission';
import { RepositoriesModule } from './repositories.module';
import { RoleModule } from './role';
import { UserModule } from './user';

export interface UserRbacModuleOptions {
  userRepositoryProvider: Provider;
  roleRepositoryProvider: Provider;
  permissionRepositoryProvider: Provider;
  userRoleRepositoryProvider: Provider;
  rolePermissionRepositoryProvider: Provider;
  /** Defaults to reading `request.user.subjectId` when omitted. Override
   * this when the consuming app's authenticated request object doesn't
   * carry `subjectId` under that exact name — see `RepositoriesModule`'s
   * own doc comment for why this has to be supplied here, at `forRoot`,
   * rather than provided locally by whatever module uses the guards. */
  identityResolverProvider?: Provider;
}

/**
 * Single entry point a consuming application imports. Each application
 * supplies its own repository implementations at `forRoot(...)`; this
 * package never touches the application's database or Prisma schema
 * directly. All five repository providers are registered exactly once, via
 * `RepositoriesModule`, so `UserService`/`RoleService`/`PermissionService`
 * share single instances of whichever repositories they have in common
 * rather than each feature module instantiating its own copy.
 */
@Module({})
export class UserRbacModule {
  static forRoot(options: UserRbacModuleOptions): DynamicModule {
    return {
      module: UserRbacModule,
      imports: [
        RepositoriesModule.forRoot({
          userRepositoryProvider: options.userRepositoryProvider,
          roleRepositoryProvider: options.roleRepositoryProvider,
          permissionRepositoryProvider: options.permissionRepositoryProvider,
          userRoleRepositoryProvider: options.userRoleRepositoryProvider,
          rolePermissionRepositoryProvider:
            options.rolePermissionRepositoryProvider,
          identityResolverProvider: options.identityResolverProvider,
        }),
        UserModule,
        RoleModule,
        PermissionModule,
        AuthorizationModule,
      ],
      exports: [UserModule, RoleModule, PermissionModule, AuthorizationModule],
    };
  }
}
