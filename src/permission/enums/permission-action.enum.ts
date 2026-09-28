/**
 * Generic, app-agnostic verbs. Resource names (e.g. "ticket", "booking")
 * are domain vocabulary owned by each consuming application and are kept as
 * plain strings rather than a shared enum, so this package never has to
 * change when an application adds a new resource.
 */
export enum PermissionAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MANAGE = 'MANAGE',
}
