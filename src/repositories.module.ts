import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { IDENTITY_RESOLVER } from './constants';
import { RequestIdentityResolver } from './authorization/identity/request-identity.resolver';

export interface RepositoriesModuleOptions {
  userRepositoryProvider: Provider;
  roleRepositoryProvider: Provider;
  permissionRepositoryProvider: Provider;
  userRoleRepositoryProvider: Provider;
  rolePermissionRepositoryProvider: Provider;
  /** Defaults to `RequestIdentityResolver` (reads `request.user.subjectId`)
   * when omitted. Override this when the consuming app's authenticated
   * request shape doesn't carry `subjectId` under that exact name (e.g. it
   * keys its own user by a local id and maps that id to `subjectId` itself) — see `IIdentityResolver`. */
  identityResolverProvider?: Provider;
}

/**
 * Registers every repository provider, plus the identity resolver, exactly
 * once for the whole package.
 *
 * Role and Permission assignment need to confirm the other side exists
 * (`RoleService` checks `USER_REPOSITORY`, `PermissionService` checks
 * `ROLE_REPOSITORY`), so those tokens are needed by more than one feature
 * module. Registering each provider per-module would mean the app's
 * repository classes (e.g. a `UserRepositoryImpl`) get instantiated once per
 * module that needs them. `@Global()` makes every export from this module
 * visible package-wide once imported here, so `UserModule`/`RoleModule`/
 * `PermissionModule`/`AuthorizationModule` can `@Inject()` these tokens
 * directly without importing this module or re-declaring the provider
 * themselves, and every consumer shares the same single instance.
 *
 * `IDENTITY_RESOLVER` lives here (not in `AuthorizationModule`, which only
 * ever consumes it) for exactly that reason: a provider a module declares
 * locally always wins over a global one for resolving that module's own
 * other providers, so registering the default `IDENTITY_RESOLVER` inside
 * `AuthorizationModule` would make a consumer's override silently never
 * reach `PermissionGuard`/`RoleGuard`. Registering it here — global, and
 * nowhere else — is what makes `identityResolverProvider` actually work.
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
      options.identityResolverProvider ?? {
        provide: IDENTITY_RESOLVER,
        useClass: RequestIdentityResolver,
      },
    ];

    return {
      module: RepositoriesModule,
      providers,
      exports: providers,
    };
  }
}
