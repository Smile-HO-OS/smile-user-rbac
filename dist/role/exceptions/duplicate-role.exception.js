"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateRoleException = void 0;
const common_1 = require("@nestjs/common");
class DuplicateRoleException extends common_1.ConflictException {
    constructor(code) {
        super(`A role already exists for code "${code}"`);
    }
}
exports.DuplicateRoleException = DuplicateRoleException;
//# sourceMappingURL=duplicate-role.exception.js.map