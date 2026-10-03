"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RepositoriesModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoriesModule = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("./constants");
const request_identity_resolver_1 = require("./authorization/identity/request-identity.resolver");
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
let RepositoriesModule = RepositoriesModule_1 = class RepositoriesModule {
    static forRoot(options) {
        const providers = [
            options.userRepositoryProvider,
            options.roleRepositoryProvider,
            options.permissionRepositoryProvider,
            options.userRoleRepositoryProvider,
            options.rolePermissionRepositoryProvider,
            options.identityResolverProvider ?? {
                provide: constants_1.IDENTITY_RESOLVER,
                useClass: request_identity_resolver_1.RequestIdentityResolver,
            },
        ];
        return {
            module: RepositoriesModule_1,
            providers,
            exports: providers,
        };
    }
};
exports.RepositoriesModule = RepositoriesModule;
exports.RepositoriesModule = RepositoriesModule = RepositoriesModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], RepositoriesModule);
//# sourceMappingURL=repositories.module.js.map