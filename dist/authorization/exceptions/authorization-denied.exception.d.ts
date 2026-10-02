/**
 * Deliberately a plain `Error`, not a NestJS `HttpException` subclass (unlike
 * the User/Role/Permission not-found/duplicate exceptions). Authorization
 * decisions need to be reusable outside an HTTP request — e.g. a message
 * consumer or a CLI job — so this package doesn't bake in a 403 status here.
 * A consuming controller/guard maps this to the transport-specific response
 * it needs (e.g. `throw new ForbiddenException()` in an HTTP exception
 * filter) rather than the package doing it for every possible transport.
 */
export declare class AuthorizationDeniedException extends Error {
    readonly userId: string;
    readonly permissionCode: string;
    constructor(userId: string, permissionCode: string, reason: string);
}
