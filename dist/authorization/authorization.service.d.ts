import type { IPermission } from '../permission/interfaces/permission.interface';
import type { IRole } from '../role/interfaces/role.interface';
import type { IUserRepository } from '../user/repositories/user-repository.interface';
import type { IAuthorizationService } from './interfaces/authorization-service.interface';
import type { IRolePermissionRepository } from './repositories/role-permission-repository.interface';
import type { IUserRoleRepository } from './repositories/user-role-repository.interface';
/**
 * Resolves whether a user has a given permission by walking
 * User → UserRole → Role → RolePermission → Permission, considering only
 * active users, active roles and active permissions. Does not touch any
 * authentication or application-access checks — this only answers "does
 * this already-identified local user have this permission" for the
 * application's own RBAC data. An unknown user is treated like an inactive
 * one: nothing is granted, and nothing throws except blank input (400) and
 * repository failures (propagated).
 */
export declare class AuthorizationService implements IAuthorizationService {
    private readonly userRepository;
    private readonly userRoleRepository;
    private readonly rolePermissionRepository;
    constructor(userRepository: IUserRepository, userRoleRepository: IUserRoleRepository, rolePermissionRepository: IRolePermissionRepository);
    hasPermission(userId: string, permissionCode: string): Promise<boolean>;
    authorize(userId: string, permissionCode: string): Promise<void>;
    getUserPermissions(userId: string): Promise<IPermission[]>;
    getUserRoles(userId: string): Promise<IRole[]>;
    private evaluate;
    /** `null` (not an error) when the user is missing or inactive. */
    private findActiveUser;
    private resolveActiveRoles;
    /**
     * Combines permissions across all of a user's active roles into one
     * deduplicated, active-only set, keyed by permission `code` so two roles
     * granting the same permission still produce a single entry.
     */
    private resolveEffectivePermissions;
    private requireNonEmpty;
}
