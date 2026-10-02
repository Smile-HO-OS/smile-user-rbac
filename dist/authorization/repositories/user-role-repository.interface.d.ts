import type { IRole } from '../../role/interfaces/role.interface';
import type { IUserRole } from '../../role/interfaces/user-role.interface';
/**
 * Owns the User ↔ Role relationship. A join record only has two states —
 * assigned or not — so this does not extend `IBaseRepository`: there is no
 * "update" for a role assignment, only assign/remove.
 */
export interface IUserRoleRepository {
    assign(userId: string, roleId: string): Promise<IUserRole>;
    remove(userId: string, roleId: string): Promise<void>;
    findRolesByUserId(userId: string): Promise<IRole[]>;
    findAssignment(userId: string, roleId: string): Promise<IUserRole | null>;
}
