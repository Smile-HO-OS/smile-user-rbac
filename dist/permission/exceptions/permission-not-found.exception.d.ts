import { NotFoundException } from '@nestjs/common';
export declare class PermissionNotFoundException extends NotFoundException {
    constructor(identifier: string);
}
