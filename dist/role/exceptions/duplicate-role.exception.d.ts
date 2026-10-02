import { ConflictException } from '@nestjs/common';
export declare class DuplicateRoleException extends ConflictException {
    constructor(code: string);
}
