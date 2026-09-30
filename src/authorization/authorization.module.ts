import { Module } from '@nestjs/common';
import { IDENTITY_RESOLVER } from '../constants';
import { UserModule } from '../user/user.module';
import { AuthorizationService } from './authorization.service';
import { PermissionGuard } from './guards/permission.guard';
import { RoleGuard } from './guards/role.guard';
import { RequestIdentityResolver } from './identity/request-identity.resolver';

/**
 * Guards are exported together with everything they inject so that
 * `@UseGuards(PermissionGuard)` works in a consuming module that imports
 * `UserRbacModule`. A consuming module may override `IDENTITY_RESOLVER` by
 * providing it locally.
 */
@Module({
  imports: [UserModule],
  providers: [
    AuthorizationService,
    { provide: IDENTITY_RESOLVER, useClass: RequestIdentityResolver },
    PermissionGuard,
    RoleGuard,
  ],
  exports: [
    AuthorizationService,
    IDENTITY_RESOLVER,
    PermissionGuard,
    RoleGuard,
  ],
})
export class AuthorizationModule {}
