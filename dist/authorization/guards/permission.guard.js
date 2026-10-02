"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const constants_1 = require("../../constants");
const user_service_1 = require("../../user/user.service");
const authorization_service_1 = require("../authorization.service");
const authorization_denied_exception_1 = require("../exceptions/authorization-denied.exception");
const base_authorization_guard_1 = require("./base-authorization.guard");
/** Enforces `@RequirePermission(...)`: the caller must hold every listed permission. */
let PermissionGuard = class PermissionGuard extends base_authorization_guard_1.BaseAuthorizationGuard {
    authorizationService;
    constructor(reflector, identityResolver, userService, authorizationService) {
        super(reflector, identityResolver, userService, constants_1.REQUIRED_PERMISSIONS_KEY);
        this.authorizationService = authorizationService;
    }
    async check(userId, required) {
        try {
            for (const permissionCode of required) {
                await this.authorizationService.authorize(userId, permissionCode);
            }
        }
        catch (error) {
            if (error instanceof authorization_denied_exception_1.AuthorizationDeniedException) {
                throw new common_1.ForbiddenException(error.message);
            }
            throw error;
        }
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(constants_1.IDENTITY_RESOLVER)),
    __metadata("design:paramtypes", [core_1.Reflector, Object, user_service_1.UserService,
        authorization_service_1.AuthorizationService])
], PermissionGuard);
//# sourceMappingURL=permission.guard.js.map