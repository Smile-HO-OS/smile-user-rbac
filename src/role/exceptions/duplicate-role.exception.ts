import { ConflictException } from '@nestjs/common';

export class DuplicateRoleException extends ConflictException {
  constructor(code: string) {
    super(`A role already exists for code "${code}"`);
  }
}
