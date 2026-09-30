import { RoleStatus } from '../enums/role-status.enum';

export interface IRole {
  id: string;
  name: string;
  code: string;
  description: string;
  status: RoleStatus;
  createdAt: Date;
  updatedAt: Date;
}
