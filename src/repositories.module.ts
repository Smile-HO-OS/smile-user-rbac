import { DynamicModule, Global, Module, Provider } from '@nestjs/common';

export interface RepositoriesModuleOptions {
  userRepositoryProvider: Provider;
  roleRepositoryProvider: Provider;
  permissionRepositoryProvider: Provider;
  userRoleRepositoryProvider: Provider;
  rolePermissionRepositoryProvider: Provider;
}

/**
 * Registers every repository provider exactly once for the whole package.
 *
 * Role and Permission assignment need to confirm the other side exists
 * (`RoleService` checks `USER_REPOSITORY`, `PermissionService` checks
 * `ROLE_REPOSITORY`), so those tokens are needed by more than one feature
 * module. Registering each provider per-module would mean the app's
 * repository classes (e.g. `PrismaUserRepository`) get instantiated once per
 * module that needs them. `@Global()` makes every export from this module
 * visible package-wide once imported here, so `UserModule`/`RoleModule`/
 * `PermissionModule` can `@Inject()` these tokens directly without importing
 * this module or re-declaring the provider themselves, and every consumer
 * shares the same single instance.
 */
@Global()
@Module({})
export class RepositoriesModule {
  static forRoot(options: RepositoriesModuleOptions): DynamicModule {
    const providers: Provider[] = [
      options.userRepositoryProvider,
      options.roleRepositoryProvider,
      options.permissionRepositoryProvider,
      options.userRoleRepositoryProvider,
      options.rolePermissionRepositoryProvider,
    ];

    return {
      module: RepositoriesModule,
      providers,
      exports: providers,
    };
  }
}
