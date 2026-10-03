import type { IPermission } from '../../permission/interfaces/permission.interface';
import type { IRole } from '../../role/interfaces/role.interface';
/**
 * Contract implemented by `AuthorizationService`, kept as an explicit
 * interface so the shape is documented independently of the class and the
 * implementation is compile-time checked against it.
 */
export interface IAuthorizationService {
    /**
     * `true` only for an active user holding the permission through an active
     * role and an active permission. Everything else is `false`, including an
     * unknown or inactive user. Rejects only for blank arguments
     * (`BadRequestException`, 400) and repository failures (propagated).
     */
    hasPermission(userId: string, permissionCode: string): Promise<boolean>;
    /**
     * Same decision as `hasPermission`, but a denial rejects with
     * `AuthorizationDeniedException` (a `ForbiddenException`, 403). Blank
     * arguments and repository failures reject exactly as for `hasPermission`.
     */
    authorize(userId: string, permissionCode: string): Promise<void>;
    /** Active permissions across the user's active roles, de-duplicated by
     * `code`. `[]` for an unknown or inactive user. */
    getUserPermissions(userId: string): Promise<IPermission[]>;
    /** The user's active roles. `[]` for an unknown or inactive user. */
    getUserRoles(userId: string): Promise<IRole[]>;
}
