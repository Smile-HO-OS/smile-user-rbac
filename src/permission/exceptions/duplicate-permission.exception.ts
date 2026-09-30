import { ConflictException } from '@nestjs/common';

export class DuplicatePermissionException extends ConflictException {
  constructor(code: string) {
    super(`A permission already exists for code "${code}"`);
  }
}
