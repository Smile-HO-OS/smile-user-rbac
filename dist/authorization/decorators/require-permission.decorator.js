"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirePermission = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../../constants");
/**
 * Requires the caller to hold permissions, enforced by `PermissionGuard`.
 * With several codes the caller must hold **all** of them. A method-level
 * decorator replaces (does not merge with) a class-level one.
 */
const RequirePermission = (...permissionCodes) => (0, common_1.SetMetadata)(constants_1.REQUIRED_PERMISSIONS_KEY, permissionCodes);
exports.RequirePermission = RequirePermission;
//# sourceMappingURL=require-permission.decorator.js.map