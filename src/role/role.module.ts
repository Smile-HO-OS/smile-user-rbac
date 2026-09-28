import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RoleService } from './role.service';

export interface RoleModuleOptions {
  /**
   * Provider for the `ROLE_REPOSITORY` token, e.g.
   * `{ provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository }`.
   */
  roleRepositoryProvider: Provider;
}

@Module({})
export class RoleModule {
  static forRoot(options: RoleModuleOptions): DynamicModule {
    return {
      module: RoleModule,
      providers: [options.roleRepositoryProvider, RoleService],
      exports: [RoleService],
    };
  }
}
