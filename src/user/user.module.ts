import { DynamicModule, Module, Provider } from '@nestjs/common';
import { UserService } from './user.service';

export interface UserModuleOptions {
  /**
   * Provider for the `USER_REPOSITORY` token, e.g.
   * `{ provide: USER_REPOSITORY, useClass: PrismaUserRepository }`.
   */
  userRepositoryProvider: Provider;
}

@Module({})
export class UserModule {
  static forRoot(options: UserModuleOptions): DynamicModule {
    return {
      module: UserModule,
      providers: [options.userRepositoryProvider, UserService],
      exports: [UserService],
    };
  }
}
