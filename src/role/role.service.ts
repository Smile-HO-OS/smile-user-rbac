import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../constants';
import type { IRoleRepository } from './repositories/role-repository.interface';

/**
 * Foundation only: DI wiring for the future Role use cases (create, update,
 * assign, remove, ...). Method implementations land in a later phase.
 */
@Injectable()
export class RoleService {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: IRoleRepository,
  ) {}
}
