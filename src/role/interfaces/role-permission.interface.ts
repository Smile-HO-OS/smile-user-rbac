/**
 * Join record representing a Permission granted to a Role. Lives alongside
 * Role because `IRoleRepository` owns the assign/remove mutations for it;
 * `IPermissionRepository.findByRoleId` covers the query side.
 */
export interface IRolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
}
