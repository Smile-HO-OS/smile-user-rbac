"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationDeniedException = void 0;
/**
 * Deliberately a plain `Error`, not a NestJS `HttpException` subclass (unlike
 * the User/Role/Permission not-found/duplicate exceptions). Authorization
 * decisions need to be reusable outside an HTTP request — e.g. a message
 * consumer or a CLI job — so this package doesn't bake in a 403 status here.
 * A consuming controller/guard maps this to the transport-specific response
 * it needs (e.g. `throw new ForbiddenException()` in an HTTP exception
 * filter) rather than the package doing it for every possible transport.
 */
class AuthorizationDeniedException extends Error {
    userId;
    permissionCode;
    constructor(userId, permissionCode, reason) {
        super(`User "${userId}" is not authorized for "${permissionCode}": ${reason}`);
        this.userId = userId;
        this.permissionCode = permissionCode;
        this.name = 'AuthorizationDeniedException';
    }
}
exports.AuthorizationDeniedException = AuthorizationDeniedException;
//# sourceMappingURL=authorization-denied.exception.js.map