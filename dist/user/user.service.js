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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
const duplicate_user_exception_1 = require("./exceptions/duplicate-user.exception");
const user_not_found_exception_1 = require("./exceptions/user-not-found.exception");
const user_status_enum_1 = require("./enums/user-status.enum");
/**
 * Manages the application's local User representation, keyed to IAM via
 * `iamUserId`. This does not authenticate the user or touch IAM's own
 * record — deactivating a local user here has no effect on the global IAM
 * identity; that synchronization is a later phase.
 */
let UserService = class UserService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async createUser(input) {
        if (!input.iamUserId?.trim()) {
            throw new common_1.BadRequestException('iamUserId is required');
        }
        const existing = await this.userRepository.findByIamUserId(input.iamUserId);
        if (existing) {
            throw new duplicate_user_exception_1.DuplicateUserException(input.iamUserId);
        }
        return this.userRepository.create(input);
    }
    async getUserById(id) {
        if (!id?.trim()) {
            throw new common_1.BadRequestException('id is required');
        }
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new user_not_found_exception_1.UserNotFoundException(id);
        }
        return user;
    }
    async getUserByIamUserId(iamUserId) {
        if (!iamUserId?.trim()) {
            throw new common_1.BadRequestException('iamUserId is required');
        }
        const user = await this.userRepository.findByIamUserId(iamUserId);
        if (!user) {
            throw new user_not_found_exception_1.UserNotFoundException(iamUserId);
        }
        return user;
    }
    async searchUsers(params) {
        if (!params.page || params.page < 1) {
            throw new common_1.BadRequestException('page must be a positive integer');
        }
        if (!params.pageSize || params.pageSize < 1) {
            throw new common_1.BadRequestException('pageSize must be a positive integer');
        }
        return this.userRepository.search(params);
    }
    /**
     * General-purpose update. `IUpdateUserInput` currently only carries
     * `status`, so this and `activateUser`/`deactivateUser` cover the same
     * ground today — see the Phase 4 report for why both are kept.
     */
    async updateUser(id, input) {
        await this.getUserById(id);
        return this.userRepository.update(id, input);
    }
    async activateUser(id) {
        return this.updateUser(id, { status: user_status_enum_1.UserStatus.ACTIVE });
    }
    async deactivateUser(id) {
        return this.updateUser(id, { status: user_status_enum_1.UserStatus.INACTIVE });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], UserService);
//# sourceMappingURL=user.service.js.map