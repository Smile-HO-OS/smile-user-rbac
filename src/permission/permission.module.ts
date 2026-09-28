import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PermissionService } from './permission.service';

export interface PermissionModuleOptions {
  /**
   * Provider for the `PERMISSION_REPOSITORY` token, e.g.
   * `{ provide: PERMISSION_REPOSITORY, useClass: PrismaPermissionRepository }`.
   */
  permissionRepositoryProvider: Provider;
}

@Module({})
export class PermissionModule {
  static forRoot(options: PermissionModuleOptions): DynamicModule {
    return {
      module: PermissionModule,
      providers: [options.permissionRepositoryProvider, PermissionService],
      exports: [PermissionService],
    };
  }
}
