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
exports.AuthorizationService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const permission_status_enum_1 = require("../permission/enums/permission-status.enum");
const role_status_enum_1 = require("../role/enums/role-status.enum");
const user_status_enum_1 = require("../user/enums/user-status.enum");
const user_not_found_exception_1 = require("../user/exceptions/user-not-found.exception");
const authorization_denied_exception_1 = require("./exceptions/authorization-denied.exception");
/**
 * Resolves whether a user has a given permission by walking
 * User → UserRole → Role → RolePermission → Permission, considering only
 * active users, active roles and active permissions. Does not touch IAM
 * authentication or application-access checks — this only answers "does
 * this already-identified local user have this permission" for the
 * application's own RBAC data.
 */
let AuthorizationService = class AuthorizationService {
    userRepository;
    userRoleRepository;
    rolePermissionRepository;
    constructor(userRepository, userRoleRepository, rolePermissionRepository) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }
    async hasPermission(userId, permissionCode) {
        this.requireNonEmpty(userId, 'userId');
        this.requireNonEmpty(permissionCode, 'permissionCode');
        const result = await this.evaluate(userId, permissionCode);
        return result.allowed;
    }
    async authorize(userId, permissionCode) {
        this.requireNonEmpty(userId, 'userId');
        this.requireNonEmpty(permissionCode, 'permissionCode');
        const result = await this.evaluate(userId, permissionCode);
        if (!result.allowed) {
            throw new authorization_denied_exception_1.AuthorizationDeniedException(userId, permissionCode, result.reason ?? 'permission not granted');
        }
    }
    async getUserPermissions(userId) {
        this.requireNonEmpty(userId, 'userId');
        const user = await this.requireActiveUser(userId);
        if (!user) {
            return [];
        }
        return this.resolveEffectivePermissions(userId);
    }
    async getUserRoles(userId) {
        this.requireNonEmpty(userId, 'userId');
        const user = await this.requireActiveUser(userId);
        if (!user) {
            return [];
        }
        return this.resolveActiveRoles(userId);
    }
    async evaluate(userId, permissionCode) {
        const user = await this.requireActiveUser(userId);
        if (!user) {
            return { allowed: false, reason: 'user is not active' };
        }
        const permissions = await this.resolveEffectivePermissions(userId);
        const granted = permissions.some((permission) => permission.code === permissionCode);
        return granted
            ? { allowed: true }
            : {
                allowed: false,
                reason: `permission "${permissionCode}" is not granted`,
            };
    }
    /** Throws if the user doesn't exist; returns `null` (not an error) if inactive. */
    async requireActiveUser(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new user_not_found_exception_1.UserNotFoundException(userId);
        }
        return user.status === user_status_enum_1.UserStatus.ACTIVE ? user : null;
    }
    async resolveActiveRoles(userId) {
        const roles = await this.userRoleRepository.findRolesByUserId(userId);
        return roles.filter((role) => role.status === role_status_enum_1.RoleStatus.ACTIVE);
    }
    /**
     * Combines permissions across all of a user's active roles into one
     * deduplicated, active-only set, keyed by permission `code` so two roles
     * granting the same permission still produce a single entry.
     */
    async resolveEffectivePermissions(userId) {
        const activeRoles = await this.resolveActiveRoles(userId);
        if (activeRoles.length === 0) {
            return [];
        }
        const permissions = await this.rolePermissionRepository.findPermissionsByRoleIds(activeRoles.map((role) => role.id));
        const uniqueActivePermissions = new Map();
        for (const permission of permissions) {
            if (permission.status === permission_status_enum_1.PermissionStatus.ACTIVE) {
                uniqueActivePermissions.set(permission.code, permission);
            }
        }
        return [...uniqueActivePermissions.values()];
    }
    requireNonEmpty(value, fieldName) {
        if (!value?.trim()) {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
    }
};
exports.AuthorizationService = AuthorizationService;
exports.AuthorizationService = AuthorizationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(constants_1.USER_ROLE_REPOSITORY)),
    __param(2, (0, common_1.Inject)(constants_1.ROLE_PERMISSION_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object])
], AuthorizationService);
//# sourceMappingURL=authorization.service.js.map