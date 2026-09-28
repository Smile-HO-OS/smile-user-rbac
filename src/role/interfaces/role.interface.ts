import { RoleStatus } from '../enums/role-status.enum';

export interface IRole {
  id: string;
  name: string;
  status: RoleStatus;
  createdAt: Date;
  updatedAt: Date;
}
