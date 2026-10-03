"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var UserRbacModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRbacModule = void 0;
const common_1 = require("@nestjs/common");
const authorization_1 = require("./authorization");
const permission_1 = require("./permission");
const repositories_module_1 = require("./repositories.module");
const role_1 = require("./role");
const user_1 = require("./user");
/**
 * Single entry point a consuming application imports. Each application
 * supplies its own repository implementations at `forRoot(...)`; this
 * package never touches the application's database schema
 * directly. All five repository providers are registered exactly once, via
 * `RepositoriesModule`, so `UserService`/`RoleService`/`PermissionService`
 * share single instances of whichever repositories they have in common
 * rather than each feature module instantiating its own copy.
 */
let UserRbacModule = UserRbacModule_1 = class UserRbacModule {
    static forRoot(options) {
        return {
            module: UserRbacModule_1,
            imports: [
                repositories_module_1.RepositoriesModule.forRoot({
                    userRepositoryProvider: options.userRepositoryProvider,
                    roleRepositoryProvider: options.roleRepositoryProvider,
                    permissionRepositoryProvider: options.permissionRepositoryProvider,
                    userRoleRepositoryProvider: options.userRoleRepositoryProvider,
                    rolePermissionRepositoryProvider: options.rolePermissionRepositoryProvider,
                    identityResolverProvider: options.identityResolverProvider,
                }),
                user_1.UserModule,
                role_1.RoleModule,
                permission_1.PermissionModule,
                authorization_1.AuthorizationModule,
            ],
            exports: [user_1.UserModule, role_1.RoleModule, permission_1.PermissionModule, authorization_1.AuthorizationModule],
        };
    }
};
exports.UserRbacModule = UserRbacModule;
exports.UserRbacModule = UserRbacModule = UserRbacModule_1 = __decorate([
    (0, common_1.Module)({})
], UserRbacModule);
//# sourceMappingURL=user-rbac.module.js.map