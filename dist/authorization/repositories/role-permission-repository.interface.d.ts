import type { IPermission } from '../../permission/interfaces/permission.interface';
import type { IRolePermission } from '../../role/interfaces/role-permission.interface';
/**
 * Owns the Role ↔ Permission relationship, mirroring `IUserRoleRepository`.
 */
export interface IRolePermissionRepository {
    assign(roleId: string, permissionId: string): Promise<IRolePermission>;
    remove(roleId: string, permissionId: string): Promise<void>;
    findPermissionsByRoleId(roleId: string): Promise<IPermission[]>;
    /**
     * Batched form of `findPermissionsByRoleId` for a user with multiple
     * roles: `AuthorizationService` resolves effective permissions across all
     * of a user's active roles in one call instead of one round-trip per
     * role, so the implementation can do a single `WHERE roleId IN (...)`
     * query.
     */
    findPermissionsByRoleIds(roleIds: string[]): Promise<IPermission[]>;
    findAssignment(roleId: string, permissionId: string): Promise<IRolePermission | null>;
}
