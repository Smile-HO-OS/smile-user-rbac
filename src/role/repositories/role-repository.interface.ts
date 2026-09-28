import type { IBaseRepository } from '../../interfaces';
import type { RoleStatus } from '../enums/role-status.enum';
import type { IRole } from '../interfaces/role.interface';

export interface ICreateRoleInput {
  name: string;
  status?: RoleStatus;
}

export interface IUpdateRoleInput {
  name?: string;
  status?: RoleStatus;
}

/**
 * Contract a consuming application implements against its own database and
 * binds to the `ROLE_REPOSITORY` token when importing `RoleModule.forRoot(...)`.
 */
export interface IRoleRepository extends IBaseRepository<
  IRole,
  string,
  ICreateRoleInput,
  IUpdateRoleInput
> {
  findByName(name: string): Promise<IRole | null>;
  assignToUser(userId: string, roleId: string): Promise<void>;
  removeFromUser(userId: string, roleId: string): Promise<void>;
  findByUserId(userId: string): Promise<IRole[]>;
}
