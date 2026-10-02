/**
 * `UserService` injects `USER_REPOSITORY` directly; the provider itself is
 * registered once, package-wide, by `RepositoriesModule` (imported by
 * `UserRbacModule.forRoot(...)`) rather than here.
 */
export declare class UserModule {
}
