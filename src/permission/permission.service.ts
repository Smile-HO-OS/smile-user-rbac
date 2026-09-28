import { Inject, Injectable } from '@nestjs/common';
import { PERMISSION_REPOSITORY } from '../constants';
import type { IPermissionRepository } from './repositories/permission-repository.interface';

/**
 * Foundation only: DI wiring for the future Permission use cases (create,
 * update, role assignment, permission checks, ...). Method implementations
 * land in a later phase.
 */
@Injectable()
export class PermissionService {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
  ) {}
}
