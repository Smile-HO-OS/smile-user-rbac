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
exports.PermissionService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const role_not_found_exception_1 = require("../role/exceptions/role-not-found.exception");
const permission_action_enum_1 = require("./enums/permission-action.enum");
const permission_status_enum_1 = require("./enums/permission-status.enum");
const duplicate_permission_exception_1 = require("./exceptions/duplicate-permission.exception");
const permission_not_found_exception_1 = require("./exceptions/permission-not-found.exception");
/** A permission `code` must be safe to use as a stable authorization key. */
const PERMISSION_CODE_PATTERN = /^[a-zA-Z0-9_.-]+$/;
/**
 * Manages permissions for a consuming application and their assignment to
 * roles. The package defines no permissions of its own — every permission's
 * `resource`/`action`/`code` (e.g. "ticket.create") comes from the
 * application; this service only provides the reusable behavior around
 * whatever permissions an application chooses to create.
 */
let PermissionService = class PermissionService {
    permissionRepository;
    rolePermissionRepository;
    roleRepository;
    constructor(permissionRepository, rolePermissionRepository, roleRepository) {
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.roleRepository = roleRepository;
    }
    async createPermission(input) {
        this.validateCode(input.code);
        this.validateResource(input.resource);
        this.validateAction(input.action);
        const existing = await this.permissionRepository.findByCode(input.code);
        if (existing) {
            throw new duplicate_permission_exception_1.DuplicatePermissionException(input.code);
        }
        return this.permissionRepository.create(input);
    }
    async getPermissionById(id) {
        if (!id?.trim()) {
            throw new common_1.BadRequestException('id is required');
        }
        const permission = await this.permissionRepository.findById(id);
        if (!permission) {
            throw new permission_not_found_exception_1.PermissionNotFoundException(id);
        }
        return permission;
    }
    async getPermissionByCode(code) {
        if (!code?.trim()) {
            throw new common_1.BadRequestException('code is required');
        }
        const permission = await this.permissionRepository.findByCode(code);
        if (!permission) {
            throw new permission_not_found_exception_1.PermissionNotFoundException(code);
        }
        return permission;
    }
    async searchPermissions(params) {
        if (!params.page || params.page < 1) {
            throw new common_1.BadRequestException('page must be a positive integer');
        }
        if (!params.pageSize || params.pageSize < 1) {
            throw new common_1.BadRequestException('pageSize must be a positive integer');
        }
        return this.permissionRepository.search(params);
    }
    async updatePermission(id, input) {
        const permission = await this.getPermissionById(id);
        if (input.code !== undefined) {
            this.validateCode(input.code);
            if (input.code !== permission.code) {
                const codeOwner = await this.permissionRepository.findByCode(input.code);
                if (codeOwner && codeOwner.id !== id) {
                    throw new duplicate_permission_exception_1.DuplicatePermissionException(input.code);
                }
            }
        }
        if (input.resource !== undefined) {
            this.validateResource(input.resource);
        }
        if (input.action !== undefined) {
            this.validateAction(input.action);
        }
        return this.permissionRepository.update(id, input);
    }
    async activatePermission(id) {
        return this.updatePermission(id, { status: permission_status_enum_1.PermissionStatus.ACTIVE });
    }
    async deactivatePermission(id) {
        return this.updatePermission(id, { status: permission_status_enum_1.PermissionStatus.INACTIVE });
    }
    /**
     * Idempotent: assigning a permission the role already has returns the
     * existing assignment instead of erroring.
     */
    async assignPermissionToRole(roleId, permissionId) {
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            throw new role_not_found_exception_1.RoleNotFoundException(roleId);
        }
        const permission = await this.getPermissionById(permissionId);
        if (permission.status !== permission_status_enum_1.PermissionStatus.ACTIVE) {
            throw new common_1.BadRequestException(`Permission "${permission.code}" is not active and cannot be assigned`);
        }
        const existingAssignment = await this.rolePermissionRepository.findAssignment(roleId, permissionId);
        if (existingAssignment) {
            return existingAssignment;
        }
        return this.rolePermissionRepository.assign(roleId, permissionId);
    }
    /**
     * Idempotent: removing a permission the role does not have is a no-op
     * rather than an error, matching typical idempotent-delete semantics.
     */
    async removePermissionFromRole(roleId, permissionId) {
        if (!roleId?.trim()) {
            throw new common_1.BadRequestException('roleId is required');
        }
        if (!permissionId?.trim()) {
            throw new common_1.BadRequestException('permissionId is required');
        }
        const existingAssignment = await this.rolePermissionRepository.findAssignment(roleId, permissionId);
        if (!existingAssignment) {
            return;
        }
        await this.rolePermissionRepository.remove(roleId, permissionId);
    }
    async getRolePermissions(roleId) {
        if (!roleId?.trim()) {
            throw new common_1.BadRequestException('roleId is required');
        }
        return this.rolePermissionRepository.findPermissionsByRoleId(roleId);
    }
    validateCode(code) {
        if (!code?.trim()) {
            throw new common_1.BadRequestException('code is required');
        }
        if (!PERMISSION_CODE_PATTERN.test(code)) {
            throw new common_1.BadRequestException('code must contain only letters, numbers, underscores, hyphens or dots');
        }
    }
    validateResource(resource) {
        if (!resource?.trim()) {
            throw new common_1.BadRequestException('resource is required');
        }
    }
    validateAction(action) {
        if (!Object.values(permission_action_enum_1.PermissionAction).includes(action)) {
            throw new common_1.BadRequestException('action must be a valid PermissionAction');
        }
    }
};
exports.PermissionService = PermissionService;
exports.PermissionService = PermissionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.PERMISSION_REPOSITORY)),
    __param(1, (0, common_1.Inject)(constants_1.ROLE_PERMISSION_REPOSITORY)),
    __param(2, (0, common_1.Inject)(constants_1.ROLE_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object])
], PermissionService);
//# sourceMappingURL=permission.service.js.map