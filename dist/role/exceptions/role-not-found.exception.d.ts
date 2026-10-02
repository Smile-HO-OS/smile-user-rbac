import { NotFoundException } from '@nestjs/common';
export declare class RoleNotFoundException extends NotFoundException {
    constructor(identifier: string);
}
