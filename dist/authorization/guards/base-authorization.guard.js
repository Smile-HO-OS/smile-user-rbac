"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAuthorizationGuard = void 0;
const common_1 = require("@nestjs/common");
const user_not_found_exception_1 = require("../../user/exceptions/user-not-found.exception");
/**
 * Shared guard flow: read the required codes from metadata, identify the
 * caller, map their `iamUserId` to the local user, then let the subclass ask
 * `AuthorizationService`. Holds no RBAC logic itself.
 *
 * - No metadata / empty list → nothing required, request passes.
 * - No authenticated identity → 401.
 * - Identity with no local user, or authorization denied → 403.
 * - Any other error (e.g. repository failure) propagates unchanged.
 */
class BaseAuthorizationGuard {
    reflector;
    identityResolver;
    userService;
    metadataKey;
    constructor(reflector, identityResolver, userService, metadataKey) {
        this.reflector = reflector;
        this.identityResolver = identityResolver;
        this.userService = userService;
        this.metadataKey = metadataKey;
    }
    async canActivate(context) {
        const required = this.reflector.getAllAndOverride(this.metadataKey, [context.getHandler(), context.getClass()]);
        if (!required?.length) {
            return true;
        }
        const identity = await this.identityResolver.resolve(context);
        if (!identity?.iamUserId) {
            throw new common_1.UnauthorizedException('Authenticated identity is required');
        }
        try {
            const user = await this.userService.getUserByIamUserId(identity.iamUserId);
            await this.check(user.id, required);
        }
        catch (error) {
            if (error instanceof user_not_found_exception_1.UserNotFoundException) {
                throw new common_1.ForbiddenException('Access denied');
            }
            throw error;
        }
        return true;
    }
}
exports.BaseAuthorizationGuard = BaseAuthorizationGuard;
//# sourceMappingURL=base-authorization.guard.js.map