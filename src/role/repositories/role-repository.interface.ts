import type {
  IBaseRepository,
  IPaginatedResult,
  IPaginationParams,
} from '../../interfaces';
import type { RoleStatus } from '../enums/role-status.enum';
import type { IRole } from '../interfaces/role.interface';

export interface ICreateRoleInput {
  name: string;
  code: string;
  description: string;
  status?: RoleStatus;
}

export interface IUpdateRoleInput {
  name?: string;
  code?: string;
  description?: string;
  status?: RoleStatus;
}

/**
 * Contract a consuming application implements against its own database and
 * binds to the `ROLE_REPOSITORY` token via `UserRbacModule.forRoot(...)`.
 * Owns Role CRUD only — the User↔Role and Role↔Permission relationships are
 * owned by `IUserRoleRepository`/`IRolePermissionRepository` in the
 * authorization module.
 */
export interface IRoleRepository extends IBaseRepository<
  IRole,
  string,
  ICreateRoleInput,
  IUpdateRoleInput
> {
  findByCode(code: string): Promise<IRole | null>;
  search(params: IPaginationParams): Promise<IPaginatedResult<IRole>>;
}
