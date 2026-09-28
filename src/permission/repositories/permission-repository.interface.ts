import type { IBaseRepository } from '../../interfaces';
import type { PermissionAction } from '../enums/permission-action.enum';
import type { IPermission } from '../interfaces/permission.interface';

export interface ICreatePermissionInput {
  name: string;
  resource: string;
  action: PermissionAction;
}

export interface IUpdatePermissionInput {
  name?: string;
  resource?: string;
  action?: PermissionAction;
}

/**
 * Contract a consuming application implements against its own database and
 * binds to the `PERMISSION_REPOSITORY` token when importing
 * `PermissionModule.forRoot(...)`.
 */
export interface IPermissionRepository extends IBaseRepository<
  IPermission,
  string,
  ICreatePermissionInput,
  IUpdatePermissionInput
> {
  findByName(name: string): Promise<IPermission | null>;
  findByRoleId(roleId: string): Promise<IPermission[]>;
}
