import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../constants';
import type { IUserRepository } from './repositories/user-repository.interface';

/**
 * Foundation only: DI wiring for the future User use cases (create, update,
 * search, activate/deactivate, ...). Method implementations land in a later
 * phase.
 */
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}
}
