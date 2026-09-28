import { PermissionAction } from '../enums/permission-action.enum';

/**
 * `name` is the fully-qualified permission key checked at the guard, e.g.
 * "ticket.create" (see `resource` + `action`).
 */
export interface IPermission {
  id: string;
  name: string;
  resource: string;
  action: PermissionAction;
  createdAt: Date;
  updatedAt: Date;
}
