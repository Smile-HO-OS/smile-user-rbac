import type { IPaginatedResult, IPaginationParams } from '../interfaces';
import type { IRolePermissionRepository } from '../authorization/repositories/role-permission-repository.interface';
import type { IRolePermission } from '../role/interfaces/role-permission.interface';
import type { IRoleRepository } from '../role/repositories/role-repository.interface';
import type { IPermission } from './interfaces/permission.interface';
import type { ICreatePermissionInput, IPermissionRepository, IUpdatePermissionInput } from './repositories/permission-repository.interface';
/**
 * Manages permissions for a consuming application and their assignment to
 * roles. The package defines no permissions of its own — every permission's
 * `resource`/`action`/`code` (e.g. "ticket.create") comes from the
 * application; this service only provides the reusable behavior around
 * whatever permissions an application chooses to create.
 */
export declare class PermissionService {
    private readonly permissionRepository;
    private readonly rolePermissionRepository;
    private readonly roleRepository;
    constructor(permissionRepository: IPermissionRepository, rolePermissionRepository: IRolePermissionRepository, roleRepository: IRoleRepository);
    createPermission(input: ICreatePermissionInput): Promise<IPermission>;
    getPermissionById(id: string): Promise<IPermission>;
    getPermissionByCode(code: string): Promise<IPermission>;
    searchPermissions(params: IPaginationParams): Promise<IPaginatedResult<IPermission>>;
    updatePermission(id: string, input: IUpdatePermissionInput): Promise<IPermission>;
    activatePermission(id: string): Promise<IPermission>;
    deactivatePermission(id: string): Promise<IPermission>;
    /**
     * Idempotent: assigning a permission the role already has returns the
     * existing assignment instead of erroring.
     */
    assignPermissionToRole(roleId: string, permissionId: string): Promise<IRolePermission>;
    /**
     * Idempotent: removing a permission the role does not have is a no-op
     * rather than an error, matching typical idempotent-delete semantics.
     */
    removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
    getRolePermissions(roleId: string): Promise<IPermission[]>;
    private validateCode;
    private validateResource;
    private validateAction;
}
