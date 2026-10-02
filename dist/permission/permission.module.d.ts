/**
 * `PermissionService` injects `PERMISSION_REPOSITORY`,
 * `ROLE_PERMISSION_REPOSITORY` and `ROLE_REPOSITORY` directly; those
 * providers are registered once, package-wide, by `RepositoriesModule`
 * (imported by `UserRbacModule.forRoot(...)`) rather than here.
 */
export declare class PermissionModule {
}
