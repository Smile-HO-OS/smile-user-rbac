"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicatePermissionException = void 0;
const common_1 = require("@nestjs/common");
class DuplicatePermissionException extends common_1.ConflictException {
    constructor(code) {
        super(`A permission already exists for code "${code}"`);
    }
}
exports.DuplicatePermissionException = DuplicatePermissionException;
//# sourceMappingURL=duplicate-permission.exception.js.map