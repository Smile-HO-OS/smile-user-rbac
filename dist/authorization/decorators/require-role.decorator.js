"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireRole = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../../constants");
/**
 * Requires the caller to hold roles (matched by role `code`), enforced by
 * `RoleGuard`. With several codes the caller must hold **all** of them. A
 * method-level decorator replaces (does not merge with) a class-level one.
 */
const RequireRole = (...roleCodes) => (0, common_1.SetMetadata)(constants_1.REQUIRED_ROLES_KEY, roleCodes);
exports.RequireRole = RequireRole;
//# sourceMappingURL=require-role.decorator.js.map