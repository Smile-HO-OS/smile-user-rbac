import type { ExecutionContext } from '@nestjs/common';
import type { IAuthenticatedIdentity } from './authenticated-identity.interface';

/**
 * Extracts the authenticated identity from the current execution context.
 * Return `undefined`/`null` when the request carries no authenticated
 * identity; guards then reject it as unauthenticated.
 */
export interface IIdentityResolver {
  resolve(
    context: ExecutionContext,
  ):
    | IAuthenticatedIdentity
    | null
    | undefined
    | Promise<IAuthenticatedIdentity | null | undefined>;
}
