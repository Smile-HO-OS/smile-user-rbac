/**
 * DI tokens used to bind a repository interface to the implementation a
 * consuming application supplies (e.g. a Prisma-backed repository). Using
 * symbols keeps the token collision-free across applications that each
 * import this package independently.
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
