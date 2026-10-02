/**
 * DI tokens used to bind a repository interface to the implementation a
 * consuming application supplies (e.g. a Prisma-backed repository). Using
 * symbols keeps the token collision-free across applications that each
 * import this package independently.
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
export const USER_ROLE_REPOSITORY = Symbol('USER_ROLE_REPOSITORY');
export const ROLE_PERMISSION_REPOSITORY = Symbol('ROLE_PERMISSION_REPOSITORY');

/**
 * Binds how guards find the authenticated caller on a request. A default
 * (`RequestIdentityResolver`, reading `request.user.subjectId`) is provided;
 * a consuming application can override it by providing this token itself.
 */
export const IDENTITY_RESOLVER = Symbol('IDENTITY_RESOLVER');
