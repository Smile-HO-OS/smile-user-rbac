import { NotFoundException } from '@nestjs/common';

export class RoleNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Role not found: ${identifier}`);
  }
}
