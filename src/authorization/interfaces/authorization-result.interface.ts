/**
 * Internal evaluation outcome shared by `hasPermission`/`authorize` so both
 * resolve the same way and `authorize` can put a specific reason in the
 * exception it throws.
 */
export interface IAuthorizationResult {
  allowed: boolean;
  reason?: string;
}
