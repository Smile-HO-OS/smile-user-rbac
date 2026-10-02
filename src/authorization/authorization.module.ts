import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthorizationService } from './authorization.service';
import { PermissionGuard } from './guards/permission.guard';
import { RoleGuard } from './guards/role.guard';

/**
 * Guards are exported together with everything they inject so that
 * `@UseGuards(PermissionGuard)` works in a consuming module that imports
 * `UserRbacModule`. `IDENTITY_RESOLVER` is deliberately NOT provided here:
 * it comes from the `@Global()` registration `UserRbacModule.forRoot(...)`
 * sets up (see `RepositoriesModule`), so a consuming app's
 * `identityResolverProvider` option actually reaches these guards — a
 * provider declared locally in this module would always win over a global
 * one for `PermissionGuard`/`RoleGuard`'s own resolution, making any
 * consumer override silently ineffective.
 */
@Module({
  imports: [UserModule],
  providers: [AuthorizationService, PermissionGuard, RoleGuard],
  exports: [AuthorizationService, PermissionGuard, RoleGuard],
})
export class AuthorizationModule {}
