/**
 * DI tokens used to bind a repository interface to the implementation a
 * consuming application supplies (e.g. a database-backed repository). Using
 * symbols keeps the token collision-free across applications that each
 * import this package independently.
 */
export declare const USER_REPOSITORY: unique symbol;
export declare const ROLE_REPOSITORY: unique symbol;
export declare const PERMISSION_REPOSITORY: unique symbol;
export declare const USER_ROLE_REPOSITORY: unique symbol;
export declare const ROLE_PERMISSION_REPOSITORY: unique symbol;
/**
 * Binds how guards find the authenticated caller on a request. A default
 * (`RequestIdentityResolver`, reading `request.user.subjectId`) is provided;
 * a consuming application can override it by providing this token itself.
 */
export declare const IDENTITY_RESOLVER: unique symbol;
