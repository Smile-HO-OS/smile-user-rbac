import { Module } from '@nestjs/common';
import { RoleService } from './role.service';

/**
 * `RoleService` injects `ROLE_REPOSITORY`, `USER_ROLE_REPOSITORY` and
 * `USER_REPOSITORY` directly; those providers are registered once,
 * package-wide, by `RepositoriesModule` (imported by
 * `UserRbacModule.forRoot(...)`) rather than here.
 */
@Module({
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
