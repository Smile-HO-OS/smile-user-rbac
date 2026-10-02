"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationModule = void 0;
const common_1 = require("@nestjs/common");
const user_module_1 = require("../user/user.module");
const authorization_service_1 = require("./authorization.service");
const permission_guard_1 = require("./guards/permission.guard");
const role_guard_1 = require("./guards/role.guard");
/**
 * Guards are exported together with everything they inject so that
 * `@UseGuards(PermissionGuard)` works in a consuming module that imports
 * `UserRbacModule`. `IDENTITY_RESOLVER` is deliberately NOT provided here:
 * it comes from the `@Global()` registration `UserRbacModule.forRoot(...)`
 * sets up (see `RepositoriesModule`), so a consuming app's
 * `identityResolverProvider` option actually reaches these guards — a
 * provider declared locally in this module would always win over a global
 * one for `PermissionGuard`/`RoleGuard`'s own resolution, making any
 * consumer override silently ineffective.
 */
let AuthorizationModule = class AuthorizationModule {
};
exports.AuthorizationModule = AuthorizationModule;
exports.AuthorizationModule = AuthorizationModule = __decorate([
    (0, common_1.Module)({
        imports: [user_module_1.UserModule],
        providers: [authorization_service_1.AuthorizationService, permission_guard_1.PermissionGuard, role_guard_1.RoleGuard],
        exports: [authorization_service_1.AuthorizationService, permission_guard_1.PermissionGuard, role_guard_1.RoleGuard],
    })
], AuthorizationModule);
//# sourceMappingURL=authorization.module.js.map