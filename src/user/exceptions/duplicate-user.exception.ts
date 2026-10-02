import { ConflictException } from '@nestjs/common';

export class DuplicateUserException extends ConflictException {
  constructor(subjectId: string) {
    super(`A user already exists for subjectId "${subjectId}"`);
  }
}
