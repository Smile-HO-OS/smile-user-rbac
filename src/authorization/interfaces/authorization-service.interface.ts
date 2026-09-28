/**
 * Target contract for Phase 2, when `@RequirePermission()` / `@RequireRole()`
 * guards are implemented on top of `AuthorizationService`. Kept here so the
 * shape is agreed now; `AuthorizationService` does not implement it yet.
 */
export interface IAuthorizationService {
  hasPermission(userId: string, permissionName: string): Promise<boolean>;
  hasRole(userId: string, roleName: string): Promise<boolean>;
}
