import { Module } from '@nestjs/common';
import { UserService } from './user.service';

/**
 * `UserService` injects `USER_REPOSITORY` directly; the provider itself is
 * registered once, package-wide, by `RepositoriesModule` (imported by
 * `UserRbacModule.forRoot(...)`) rather than here.
 */
@Module({
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
