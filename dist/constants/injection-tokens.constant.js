"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDENTITY_RESOLVER = exports.ROLE_PERMISSION_REPOSITORY = exports.USER_ROLE_REPOSITORY = exports.PERMISSION_REPOSITORY = exports.ROLE_REPOSITORY = exports.USER_REPOSITORY = void 0;
/**
 * DI tokens used to bind a repository interface to the implementation a
 * consuming application supplies (e.g. a database-backed repository). Using
 * symbols keeps the token collision-free across applications that each
 * import this package independently.
 */
exports.USER_REPOSITORY = Symbol('USER_REPOSITORY');
exports.ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');
exports.PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
exports.USER_ROLE_REPOSITORY = Symbol('USER_ROLE_REPOSITORY');
exports.ROLE_PERMISSION_REPOSITORY = Symbol('ROLE_PERMISSION_REPOSITORY');
/**
 * Binds how guards find the authenticated caller on a request. A default
 * (`RequestIdentityResolver`, reading `request.user.subjectId`) is provided;
 * a consuming application can override it by providing this token itself.
 */
exports.IDENTITY_RESOLVER = Symbol('IDENTITY_RESOLVER');
//# sourceMappingURL=injection-tokens.constant.js.map