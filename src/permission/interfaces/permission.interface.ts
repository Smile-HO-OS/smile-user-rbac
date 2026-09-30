import { PermissionAction } from '../enums/permission-action.enum';
import { PermissionStatus } from '../enums/permission-status.enum';

/**
 * `code` is the fully-qualified permission key checked at the guard, e.g.
 * "ticket.create" (see `resource` + `action`).
 */
export interface IPermission {
  id: string;
  code: string;
  resource: string;
  action: PermissionAction;
  description: string;
  status: PermissionStatus;
  createdAt: Date;
  updatedAt: Date;
}
