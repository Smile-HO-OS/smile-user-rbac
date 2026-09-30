import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IDENTITY_RESOLVER, REQUIRED_PERMISSIONS_KEY } from '../../constants';
import { UserService } from '../../user/user.service';
import { AuthorizationService } from '../authorization.service';
import { AuthorizationDeniedException } from '../exceptions/authorization-denied.exception';
import type { IIdentityResolver } from '../interfaces/identity-resolver.interface';
import { BaseAuthorizationGuard } from './base-authorization.guard';

/** Enforces `@RequirePermission(...)`: the caller must hold every listed permission. */
@Injectable()
export class PermissionGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    @Inject(IDENTITY_RESOLVER) identityResolver: IIdentityResolver,
    userService: UserService,
    private readonly authorizationService: AuthorizationService,
  ) {
    super(reflector, identityResolver, userService, REQUIRED_PERMISSIONS_KEY);
  }

  protected async check(userId: string, required: string[]): Promise<void> {
    try {
      for (const permissionCode of required) {
        await this.authorizationService.authorize(userId, permissionCode);
      }
    } catch (error) {
      if (error instanceof AuthorizationDeniedException) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}
