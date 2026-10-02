import { Reflector } from '@nestjs/core';
import { UserService } from '../../user/user.service';
import { AuthorizationService } from '../authorization.service';
import type { IIdentityResolver } from '../interfaces/identity-resolver.interface';
import { BaseAuthorizationGuard } from './base-authorization.guard';
/** Enforces `@RequirePermission(...)`: the caller must hold every listed permission. */
export declare class PermissionGuard extends BaseAuthorizationGuard {
    private readonly authorizationService;
    constructor(reflector: Reflector, identityResolver: IIdentityResolver, userService: UserService, authorizationService: AuthorizationService);
    protected check(userId: string, required: string[]): Promise<void>;
}
