import type { IPaginatedResult, IPaginationParams } from '../interfaces';
import type { IUserRepository } from '../user/repositories/user-repository.interface';
import type { IUserRoleRepository } from '../authorization/repositories/user-role-repository.interface';
import type { IRole } from './interfaces/role.interface';
import type { IUserRole } from './interfaces/user-role.interface';
import type { ICreateRoleInput, IRoleRepository, IUpdateRoleInput } from './repositories/role-repository.interface';
/**
 * Manages roles for a consuming application and their assignment to users.
 * The package defines no roles of its own — every role's name, code and
 * description come from the application (e.g. Support's "Support Manager"
 * vs. Bookings' "Booking Admin"); this service only provides the reusable
 * behavior around whatever roles an application chooses to create.
 */
export declare class RoleService {
    private readonly roleRepository;
    private readonly userRoleRepository;
    private readonly userRepository;
    constructor(roleRepository: IRoleRepository, userRoleRepository: IUserRoleRepository, userRepository: IUserRepository);
    createRole(input: ICreateRoleInput): Promise<IRole>;
    getRoleById(id: string): Promise<IRole>;
    getRoleByCode(code: string): Promise<IRole>;
    searchRoles(params: IPaginationParams): Promise<IPaginatedResult<IRole>>;
    updateRole(id: string, input: IUpdateRoleInput): Promise<IRole>;
    activateRole(id: string): Promise<IRole>;
    deactivateRole(id: string): Promise<IRole>;
    /**
     * Idempotent: assigning a role the user already has returns the existing
     * assignment instead of erroring.
     */
    assignRoleToUser(userId: string, roleId: string): Promise<IUserRole>;
    /**
     * Idempotent: removing a role the user does not have is a no-op rather
     * than an error, matching typical idempotent-delete semantics.
     */
    removeRoleFromUser(userId: string, roleId: string): Promise<void>;
    getUserRoles(userId: string): Promise<IRole[]>;
    private validateCode;
}
