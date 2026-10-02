"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateUserException = void 0;
const common_1 = require("@nestjs/common");
class DuplicateUserException extends common_1.ConflictException {
    constructor(subjectId) {
        super(`A user already exists for subjectId "${subjectId}"`);
    }
}
exports.DuplicateUserException = DuplicateUserException;
//# sourceMappingURL=duplicate-user.exception.js.map