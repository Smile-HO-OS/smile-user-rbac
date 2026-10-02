import { ConflictException } from '@nestjs/common';
export declare class DuplicatePermissionException extends ConflictException {
    constructor(code: string);
}
