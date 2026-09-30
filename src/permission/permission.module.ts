import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';

/**
 * `PermissionService` injects `PERMISSION_REPOSITORY`,
 * `ROLE_PERMISSION_REPOSITORY` and `ROLE_REPOSITORY` directly; those
 * providers are registered once, package-wide, by `RepositoriesModule`
 * (imported by `UserRbacModule.forRoot(...)`) rather than here.
 */
@Module({
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
