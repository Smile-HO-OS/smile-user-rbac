"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationDeniedException = void 0;
const common_1 = require("@nestjs/common");
/**
 * Thrown by `AuthorizationService.authorize` when a user does not hold a
 * permission. A `ForbiddenException`, so it maps to 403 on its own (like the
 * package's other exceptions, which are all `HttpException`s) with no extra
 * handling in the consuming application.
 */
class AuthorizationDeniedException extends common_1.ForbiddenException {
    userId;
    permissionCode;
    constructor(userId, permissionCode, reason) {
        super(`User "${userId}" is not authorized for "${permissionCode}": ${reason}`);
        this.userId = userId;
        this.permissionCode = permissionCode;
    }
}
exports.AuthorizationDeniedException = AuthorizationDeniedException;
//# sourceMappingURL=authorization-denied.exception.js.map