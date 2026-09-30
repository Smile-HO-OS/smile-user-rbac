import type {
  IBaseRepository,
  IPaginatedResult,
  IPaginationParams,
} from '../../interfaces';
import type { PermissionAction } from '../enums/permission-action.enum';
import type { PermissionStatus } from '../enums/permission-status.enum';
import type { IPermission } from '../interfaces/permission.interface';

export interface ICreatePermissionInput {
  code: string;
  resource: string;
  action: PermissionAction;
  description: string;
  status?: PermissionStatus;
}

export interface IUpdatePermissionInput {
  code?: string;
  resource?: string;
  action?: PermissionAction;
  description?: string;
  status?: PermissionStatus;
}

/**
 * Contract a consuming application implements against its own database and
 * binds to the `PERMISSION_REPOSITORY` token when importing
 * `PermissionModule.forRoot(...)`.
 * Owns Permission CRUD only — the Role↔Permission relationship is owned by
 * `IRolePermissionRepository` in the authorization module.
 */
export interface IPermissionRepository extends IBaseRepository<
  IPermission,
  string,
  ICreatePermissionInput,
  IUpdatePermissionInput
> {
  findByCode(code: string): Promise<IPermission | null>;
  search(params: IPaginationParams): Promise<IPaginatedResult<IPermission>>;
}
