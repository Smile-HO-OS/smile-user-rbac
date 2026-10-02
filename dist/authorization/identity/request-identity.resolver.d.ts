import { ExecutionContext } from '@nestjs/common';
import type { IAuthenticatedIdentity } from '../interfaces/authenticated-identity.interface';
import type { IIdentityResolver } from '../interfaces/identity-resolver.interface';
/**
 * Default resolver: reads `request.user.subjectId`, the conventional place
 * an upstream authentication layer attaches the caller. This package does
 * not populate `request.user` itself.
 */
export declare class RequestIdentityResolver implements IIdentityResolver {
    resolve(context: ExecutionContext): IAuthenticatedIdentity | undefined;
}
