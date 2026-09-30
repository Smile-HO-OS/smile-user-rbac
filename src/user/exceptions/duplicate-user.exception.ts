import { ConflictException } from '@nestjs/common';

export class DuplicateUserException extends ConflictException {
  constructor(iamUserId: string) {
    super(`A user already exists for iamUserId "${iamUserId}"`);
  }
}
