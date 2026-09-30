import { ExecutionContext, Injectable } from '@nestjs/common';
import type { IAuthenticatedIdentity } from '../interfaces/authenticated-identity.interface';
import type { IIdentityResolver } from '../interfaces/identity-resolver.interface';

/**
 * Default resolver: reads `request.user.iamUserId`, the conventional place
 * an upstream authentication layer attaches the caller. This package does
 * not populate `request.user` itself.
 */
@Injectable()
export class RequestIdentityResolver implements IIdentityResolver {
  resolve(context: ExecutionContext): IAuthenticatedIdentity | undefined {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { iamUserId?: unknown } }>();
    const iamUserId = request?.user?.iamUserId;

    return typeof iamUserId === 'string' && iamUserId.trim()
      ? { iamUserId }
      : undefined;
  }
}
