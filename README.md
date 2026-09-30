# @shree-maruti/nestjs-user-rbac

Reusable User + RBAC (Role-Based Access Control) backend module for Shree
Maruti's NestJS applications (IAM, Support, Bookings, HubOps, and future
apps). **This is the foundation phase**: folder structure, contracts and
tooling only — no business logic yet. See [`docs/architecture.md`](docs/architecture.md)
for the full repository-abstraction writeup.

## Why a shared package

User identity, roles and permissions are the same concept across every
Shree Maruti application, but each application owns its own database. Rather
than every app reimplementing `UserService`/`RoleService`/`PermissionService`
against its own Prisma schema, this package defines the shared contracts and
DI wiring once; each application supplies its own repository implementation.

## Why `nestjs-user-rbac` over `user-rbac`

The package is coupled to NestJS from the ground up (`@Module`, `@Injectable`,
`@Inject`, dynamic modules) — it is not a framework-agnostic core with a thin
Nest adapter. Naming it `nestjs-user-rbac` says that plainly up front (in
line with the community convention of `nestjs-*` packages) and leaves
`@shree-maruti/user-rbac` free later if a framework-agnostic core is ever
split out.

## Folder structure

```text
user-rbac/
├── src/
│   ├── user/                 User entity, enums, repository contract, service, dynamic module
│   ├── role/                 Role entity, enums, repository contract, service, dynamic module
│   ├── permission/            Permission entity, enums, repository contract, service, dynamic module
│   ├── authorization/         AuthorizationService shell + its Phase-2 interface contract
│   ├── interfaces/            Cross-cutting contracts (IBaseRepository, pagination)
│   ├── constants/              DI injection tokens (USER_REPOSITORY, ROLE_REPOSITORY, PERMISSION_REPOSITORY)
│   ├── user-rbac.module.ts    Composition root apps import
│   └── index.ts               Public package exports
├── test/                      Vitest specs
├── docs/architecture.md       Repository abstraction, plug-in guide, what's deferred
├── .husky/                    pre-commit (lint-staged), commit-msg (commitlint)
├── eslint.config.mjs, .prettierrc, tsconfig*.json, vitest.config.ts
└── package.json
```

Each of `user/`, `role/`, `permission/` follows the same internal shape:

- `enums/` — only the enums actually referenced by an interface today
  (`UserStatus`, `RoleStatus`, `PermissionAction`).
- `interfaces/` — the entity shape (`IUser`, `IRole`, `IPermission`).
- `repositories/` — the repository _contract_ (`IUserRepository`, ...) plus
  its create/update input shapes. No implementation lives here.
- `<name>.service.ts` — implements the module's use cases against its
  repository interface(s), injected via `@Inject()`.
- `<name>.module.ts` — a plain module declaring the service. The repository
  providers it injects are registered once, package-wide, by
  `RepositoriesModule` inside `UserRbacModule.forRoot(...)` — see
  [`docs/architecture.md`](docs/architecture.md).

`dto/`, `guards/`, `decorators/`, `constants/` and `enums/` at the top level
from the originally proposed tree were deliberately **not** created yet —
there is nothing to put in them until CRUD/guards land, and empty folders
aren't tracked by git anyway. They're documented as planned in
[Future phases](#future-phases) below instead.

## Database-agnostic design

No file in `src/` imports Prisma, a database client, or any application's
schema. See [`docs/architecture.md`](docs/architecture.md) for the full
repository-abstraction diagram and a worked example of an application
plugging in its own `PrismaUserRepository`.

## Consuming this package (once repository implementations exist)

```typescript
import {
  UserRbacModule,
  USER_REPOSITORY,
  ROLE_REPOSITORY,
  PERMISSION_REPOSITORY,
  USER_ROLE_REPOSITORY,
  ROLE_PERMISSION_REPOSITORY,
} from '@shree-maruti/nestjs-user-rbac';

@Module({
  imports: [
    UserRbacModule.forRoot({
      userRepositoryProvider: {
        provide: USER_REPOSITORY,
        useClass: PrismaUserRepository,
      },
      roleRepositoryProvider: {
        provide: ROLE_REPOSITORY,
        useClass: PrismaRoleRepository,
      },
      permissionRepositoryProvider: {
        provide: PERMISSION_REPOSITORY,
        useClass: PrismaPermissionRepository,
      },
      userRoleRepositoryProvider: {
        provide: USER_ROLE_REPOSITORY,
        useClass: PrismaUserRoleRepository,
      },
      rolePermissionRepositoryProvider: {
        provide: ROLE_PERMISSION_REPOSITORY,
        useClass: PrismaRolePermissionRepository,
      },
    }),
  ],
})
export class AppModule {}
```

## Scripts

```bash
npm run lint          # eslint
npm run lint:fix
npm run format         # prettier --write
npm run format:check
npm run typecheck      # tsc --noEmit
npm run build          # tsc -p tsconfig.build.json -> dist/
npm run test           # vitest run
npm run test:watch
npm run test:cov
```

Husky's pre-commit hook runs `lint-staged` (eslint --fix + prettier --write
on staged files); the commit-msg hook enforces Conventional Commits via
commitlint, matching `iam-logistics-backend`'s convention.

## Not implemented yet (by design — foundation phase only)

- User / Role / Permission CRUD (service method bodies)
- Authentication
- IAM integration
- Directory implementation
- Message broker implementation
- Application access implementation
- `@RequirePermission()` / `@RequireRole()` guards and decorators
- HTTP-facing DTOs (`class-validator` request/response shapes)
- Any Prisma schema or database client (intentionally never added here)

## Future phases

1. User CRUD, search/pagination, activate/deactivate — implement
   `UserService` against `IUserRepository`.
2. Role CRUD, assignment — implement `RoleService`.
3. Permission CRUD, role→permission mapping — implement `PermissionService`.
4. Authorization: implement `AuthorizationService` against
   `IAuthorizationService`, then add `guards/` and `decorators/`
   (`@RequirePermission()`, `@RequireRole()`).
5. Per-application `dto/` layers and controllers, added where each
   application actually exposes HTTP endpoints for these.
6. First real consuming application (Prisma repository implementations) —
   done inside that application's own repo, not here.
