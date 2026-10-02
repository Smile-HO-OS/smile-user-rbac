import { ConflictException } from '@nestjs/common';
export declare class DuplicateUserException extends ConflictException {
    constructor(iamUserId: string);
}
