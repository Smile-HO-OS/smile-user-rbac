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
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const user_not_found_exception_1 = require("../user/exceptions/user-not-found.exception");
const role_status_enum_1 = require("./enums/role-status.enum");
const duplicate_role_exception_1 = require("./exceptions/duplicate-role.exception");
const role_not_found_exception_1 = require("./exceptions/role-not-found.exception");
/** A role `code` must be safe to use as a stable, programmatic reference. */
const ROLE_CODE_PATTERN = /^[a-zA-Z0-9_.-]+$/;
/**
 * Manages roles for a consuming application and their assignment to users.
 * The package defines no roles of its own — every role's name, code and
 * description come from the application (e.g. Support's "Support Manager"
 * vs. Bookings' "Booking Admin"); this service only provides the reusable
 * behavior around whatever roles an application chooses to create.
 */
let RoleService = class RoleService {
    roleRepository;
    userRoleRepository;
    userRepository;
    constructor(roleRepository, userRoleRepository, userRepository) {
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.userRepository = userRepository;
    }
    async createRole(input) {
        this.validateCode(input.code);
        if (!input.name?.trim()) {
            throw new common_1.BadRequestException('name is required');
        }
        const existing = await this.roleRepository.findByCode(input.code);
        if (existing) {
            throw new duplicate_role_exception_1.DuplicateRoleException(input.code);
        }
        return this.roleRepository.create(input);
    }
    async getRoleById(id) {
        if (!id?.trim()) {
            throw new common_1.BadRequestException('id is required');
        }
        const role = await this.roleRepository.findById(id);
        if (!role) {
            throw new role_not_found_exception_1.RoleNotFoundException(id);
        }
        return role;
    }
    async getRoleByCode(code) {
        if (!code?.trim()) {
            throw new common_1.BadRequestException('code is required');
        }
        const role = await this.roleRepository.findByCode(code);
        if (!role) {
            throw new role_not_found_exception_1.RoleNotFoundException(code);
        }
        return role;
    }
    async searchRoles(params) {
        if (!params.page || params.page < 1) {
            throw new common_1.BadRequestException('page must be a positive integer');
        }
        if (!params.pageSize || params.pageSize < 1) {
            throw new common_1.BadRequestException('pageSize must be a positive integer');
        }
        return this.roleRepository.search(params);
    }
    async updateRole(id, input) {
        const role = await this.getRoleById(id);
        if (input.code !== undefined) {
            this.validateCode(input.code);
            if (input.code !== role.code) {
                const codeOwner = await this.roleRepository.findByCode(input.code);
                if (codeOwner && codeOwner.id !== id) {
                    throw new duplicate_role_exception_1.DuplicateRoleException(input.code);
                }
            }
        }
        return this.roleRepository.update(id, input);
    }
    async activateRole(id) {
        return this.updateRole(id, { status: role_status_enum_1.RoleStatus.ACTIVE });
    }
    async deactivateRole(id) {
        return this.updateRole(id, { status: role_status_enum_1.RoleStatus.INACTIVE });
    }
    /**
     * Idempotent: assigning a role the user already has returns the existing
     * assignment instead of erroring.
     */
    async assignRoleToUser(userId, roleId) {
        if (!userId?.trim()) {
            throw new common_1.BadRequestException('userId is required');
        }
        const role = await this.getRoleById(roleId);
        if (role.status !== role_status_enum_1.RoleStatus.ACTIVE) {
            throw new common_1.BadRequestException(`Role "${role.code}" is not active and cannot be assigned`);
        }
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new user_not_found_exception_1.UserNotFoundException(userId);
        }
        const existingAssignment = await this.userRoleRepository.findAssignment(userId, roleId);
        if (existingAssignment) {
            return existingAssignment;
        }
        return this.userRoleRepository.assign(userId, roleId);
    }
    /**
     * Idempotent: removing a role the user does not have is a no-op rather
     * than an error, matching typical idempotent-delete semantics.
     */
    async removeRoleFromUser(userId, roleId) {
        if (!userId?.trim()) {
            throw new common_1.BadRequestException('userId is required');
        }
        if (!roleId?.trim()) {
            throw new common_1.BadRequestException('roleId is required');
        }
        const existingAssignment = await this.userRoleRepository.findAssignment(userId, roleId);
        if (!existingAssignment) {
            return;
        }
        await this.userRoleRepository.remove(userId, roleId);
    }
    async getUserRoles(userId) {
        if (!userId?.trim()) {
            throw new common_1.BadRequestException('userId is required');
        }
        return this.userRoleRepository.findRolesByUserId(userId);
    }
    validateCode(code) {
        if (!code?.trim()) {
            throw new common_1.BadRequestException('code is required');
        }
        if (!ROLE_CODE_PATTERN.test(code)) {
            throw new common_1.BadRequestException('code must contain only letters, numbers, underscores, hyphens or dots');
        }
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.ROLE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(constants_1.USER_ROLE_REPOSITORY)),
    __param(2, (0, common_1.Inject)(constants_1.USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object])
], RoleService);
//# sourceMappingURL=role.service.js.map