import type { IPermission } from '../../permission/interfaces/permission.interface';
import type { IRole } from '../../role/interfaces/role.interface';
/**
 * Contract implemented by `AuthorizationService`, kept as an explicit
 * interface so the shape is documented independently of the class and the
 * implementation is compile-time checked against it.
 */
export interface IAuthorizationService {
    hasPermission(userId: string, permissionCode: string): Promise<boolean>;
    authorize(userId: string, permissionCode: string): Promise<void>;
    getUserPermissions(userId: string): Promise<IPermission[]>;
    getUserRoles(userId: string): Promise<IRole[]>;
}
