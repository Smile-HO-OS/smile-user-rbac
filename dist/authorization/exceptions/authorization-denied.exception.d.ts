import { ForbiddenException } from '@nestjs/common';
/**
 * Thrown by `AuthorizationService.authorize` when a user does not hold a
 * permission. A `ForbiddenException`, so it maps to 403 on its own (like the
 * package's other exceptions, which are all `HttpException`s) with no extra
 * handling in the consuming application.
 */
export declare class AuthorizationDeniedException extends ForbiddenException {
    readonly userId: string;
    readonly permissionCode: string;
    constructor(userId: string, permissionCode: string, reason: string);
}
