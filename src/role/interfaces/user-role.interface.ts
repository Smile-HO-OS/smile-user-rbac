/**
 * Join record representing a Role assigned to a User. Lives alongside Role
 * because `IRoleRepository` owns the assign/remove mutations for it.
 */
export interface IUserRole {
  id: string;
  userId: string;
  roleId: string;
  createdAt: Date;
}
