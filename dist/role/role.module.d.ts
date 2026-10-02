/**
 * `RoleService` injects `ROLE_REPOSITORY`, `USER_ROLE_REPOSITORY` and
 * `USER_REPOSITORY` directly; those providers are registered once,
 * package-wide, by `RepositoriesModule` (imported by
 * `UserRbacModule.forRoot(...)`) rather than here.
 */
export declare class RoleModule {
}
