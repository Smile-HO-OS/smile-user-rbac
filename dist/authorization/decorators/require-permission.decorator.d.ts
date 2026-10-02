/**
 * Requires the caller to hold permissions, enforced by `PermissionGuard`.
 * With several codes the caller must hold **all** of them. A method-level
 * decorator replaces (does not merge with) a class-level one.
 */
export declare const RequirePermission: (...permissionCodes: string[]) => import("@nestjs/common").CustomDecorator<string>;
