/**
 * Requires the caller to hold roles (matched by role `code`), enforced by
 * `RoleGuard`. With several codes the caller must hold **all** of them. A
 * method-level decorator replaces (does not merge with) a class-level one.
 */
export declare const RequireRole: (...roleCodes: string[]) => import("@nestjs/common").CustomDecorator<string>;
