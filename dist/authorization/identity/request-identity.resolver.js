"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIdentityResolver = void 0;
const common_1 = require("@nestjs/common");
/**
 * Default resolver: reads `request.user.subjectId`, the conventional place
 * an upstream authentication layer attaches the caller. This package does
 * not populate `request.user` itself.
 */
let RequestIdentityResolver = class RequestIdentityResolver {
    resolve(context) {
        const request = context
            .switchToHttp()
            .getRequest();
        const subjectId = request?.user?.subjectId;
        return typeof subjectId === 'string' && subjectId.trim()
            ? { subjectId }
            : undefined;
    }
};
exports.RequestIdentityResolver = RequestIdentityResolver;
exports.RequestIdentityResolver = RequestIdentityResolver = __decorate([
    (0, common_1.Injectable)()
], RequestIdentityResolver);
//# sourceMappingURL=request-identity.resolver.js.map