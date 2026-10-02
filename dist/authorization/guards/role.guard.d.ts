import { Reflector } from '@nestjs/core';
import { UserService } from '../../user/user.service';
import { AuthorizationService } from '../authorization.service';
import type { IIdentityResolver } from '../interfaces/identity-resolver.interface';
import { BaseAuthorizationGuard } from './base-authorization.guard';
/**
 * Enforces `@RequireRole(...)`: the caller must hold every listed role
 * (by role `code`). Only active roles of an active user count, as resolved
 * by `AuthorizationService.getUserRoles`.
 */
export declare class RoleGuard extends BaseAuthorizationGuard {
    private readonly authorizationService;
    constructor(reflector: Reflector, identityResolver: IIdentityResolver, userService: UserService, authorizationService: AuthorizationService);
    protected check(userId: string, required: string[]): Promise<void>;
}
