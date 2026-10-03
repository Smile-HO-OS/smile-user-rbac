import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { UserNotFoundException } from '../../user/exceptions/user-not-found.exception';
import type { UserService } from '../../user/user.service';
import type { IIdentityResolver } from '../interfaces/identity-resolver.interface';

/**
 * Shared guard flow: read the required codes from metadata, identify the
 * caller, map their `subjectId` to the local user, then let the subclass ask
 * `AuthorizationService`. Holds no RBAC logic itself.
 *
 * - No metadata / empty list → nothing required, request passes.
 * - No authenticated identity (missing, or a blank `subjectId`) → 401.
 * - Identity with no local user, or authorization denied → 403.
 * - Any other error (e.g. repository failure) propagates unchanged.
 */
export abstract class BaseAuthorizationGuard implements CanActivate {
  protected constructor(
    private readonly reflector: Reflector,
    private readonly identityResolver: IIdentityResolver,
    private readonly userService: UserService,
    private readonly metadataKey: string,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      this.metadataKey,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }

    const identity = await this.identityResolver.resolve(context);
    if (typeof identity?.subjectId !== 'string' || !identity.subjectId.trim()) {
      throw new UnauthorizedException('Authenticated identity is required');
    }

    try {
      const user = await this.userService.getUserBySubjectId(
        identity.subjectId,
      );
      await this.check(user.id, required);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new ForbiddenException('Access denied');
      }
      throw error;
    }
    return true;
  }

  /** Must throw `ForbiddenException` when the user lacks any required code. */
  protected abstract check(userId: string, required: string[]): Promise<void>;
}
