import { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { UserService } from '../../user/user.service';
import type { IIdentityResolver } from '../interfaces/identity-resolver.interface';
/**
 * Shared guard flow: read the required codes from metadata, identify the
 * caller, map their `subjectId` to the local user, then let the subclass ask
 * `AuthorizationService`. Holds no RBAC logic itself.
 *
 * - No metadata / empty list → nothing required, request passes.
 * - No authenticated identity → 401.
 * - Identity with no local user, or authorization denied → 403.
 * - Any other error (e.g. repository failure) propagates unchanged.
 */
export declare abstract class BaseAuthorizationGuard implements CanActivate {
    private readonly reflector;
    private readonly identityResolver;
    private readonly userService;
    private readonly metadataKey;
    protected constructor(reflector: Reflector, identityResolver: IIdentityResolver, userService: UserService, metadataKey: string);
    canActivate(context: ExecutionContext): Promise<boolean>;
    /** Must throw `ForbiddenException` when the user lacks any required code. */
    protected abstract check(userId: string, required: string[]): Promise<void>;
}
