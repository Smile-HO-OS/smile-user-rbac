import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AuthorizationModule } from './authorization';
import { PermissionModule } from './permission';
import { RoleModule } from './role';
import { UserModule } from './user';

export interface UserRbacModuleOptions {
  userRepositoryProvider: Provider;
  roleRepositoryProvider: Provider;
  permissionRepositoryProvider: Provider;
}

/**
 * Single entry point a consuming application imports. Each application
 * supplies its own repository implementations at `forRoot(...)`; this
 * package never touches the application's database or Prisma schema
 * directly.
 */
@Module({})
export class UserRbacModule {
  static forRoot(options: UserRbacModuleOptions): DynamicModule {
    return {
      module: UserRbacModule,
      imports: [
        UserModule.forRoot({
          userRepositoryProvider: options.userRepositoryProvider,
        }),
        RoleModule.forRoot({
          roleRepositoryProvider: options.roleRepositoryProvider,
        }),
        PermissionModule.forRoot({
          permissionRepositoryProvider: options.permissionRepositoryProvider,
        }),
        AuthorizationModule,
      ],
      exports: [UserModule, RoleModule, PermissionModule, AuthorizationModule],
    };
  }
}
