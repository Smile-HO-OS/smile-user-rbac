"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionAction = void 0;
/**
 * Generic, app-agnostic verbs. Resource names (e.g. "ticket", "booking")
 * are domain vocabulary owned by each consuming application and are kept as
 * plain strings rather than a shared enum, so this package never has to
 * change when an application adds a new resource.
 */
var PermissionAction;
(function (PermissionAction) {
    PermissionAction["CREATE"] = "CREATE";
    PermissionAction["READ"] = "READ";
    PermissionAction["UPDATE"] = "UPDATE";
    PermissionAction["DELETE"] = "DELETE";
    PermissionAction["MANAGE"] = "MANAGE";
})(PermissionAction || (exports.PermissionAction = PermissionAction = {}));
//# sourceMappingURL=permission-action.enum.js.map