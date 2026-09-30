# Architecture

For the system overview, request flow and step-by-step integration, see
[integration-guide.md](./integration-guide.md).

## Repository abstraction

Every entity (`User`, `Role`, `Permission`) is defined by two things in this
package:

1. An entity interface describing its shape (`IUser`, `IRole`, `IPermission`).
2. A repository interface describing how it's persisted and queried
   (`IUserRepository`, `IRoleRepository`, `IPermissionRepository`), each
   extending the shared `IBaseRepository<TEntity, TId, TCreateInput, TUpdateInput>`
   contract from `src/interfaces/base-repository.interface.ts`.

No file in this package imports Prisma, a database driver, or any
application's schema. Services (`UserService`, `RoleService`,
`PermissionService`) depend only on the repository _interface_, injected via
a `Symbol` token (`USER_REPOSITORY`, `ROLE_REPOSITORY`,
`PERMISSION_REPOSITORY`, defined in `src/constants/injection-tokens.constant.ts`):

```text
                UserService
                     │
                     ▼
              IUserRepository
                 (interface)
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
     IAM's Prisma  Support's   Booking's
     UserRepository Prisma...  Prisma...
          │          │          │
        IAM DB    Support DB   Booking DB
```

## How an application plugs in its repository

`UserRbacModule.forRoot(...)` is the only dynamic module a consuming
application touches. Internally, it imports a `@Global()` `RepositoriesModule.forRoot(...)`
that registers all five repository providers — `USER_REPOSITORY`,
`ROLE_REPOSITORY`, `PERMISSION_REPOSITORY`, `USER_ROLE_REPOSITORY`,
`ROLE_PERMISSION_REPOSITORY` — exactly once, then imports the plain
`UserModule`/`RoleModule`/`PermissionModule`/`AuthorizationModule`, whose
services `@Inject()` those tokens directly. This matters because some
services need a repository that "belongs" to another entity — `RoleService`
checks `USER_REPOSITORY` before assigning a role, `PermissionService` checks
`ROLE_REPOSITORY` before assigning a permission — and registering each
provider once, package-wide, means every service sees the same instance
instead of each feature module instantiating its own copy of e.g.
`PrismaUserRepository`.

The consuming application supplies a `Provider` for each token — most
commonly `useClass` pointing at its own Prisma-backed implementation:

```typescript
// inside e.g. the Support application
class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}
  // findById / create / update / delete / findByIamUserId / search
}

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

`PrismaUserRepository` lives entirely inside the consuming application's own
codebase (its own Prisma schema, its own database). This package never sees
it at compile time — only through the `IUserRepository` interface it
implements.

## Why interfaces have method signatures already

The repository interfaces (`findById`, `create`, `findByIamUserId`,
`search`, ...) are contracts, not implementations — no method body runs any
query. Defining them now, rather than deferring everything, is what makes
the package "ready" for Phase 2: an application team can start writing its
Prisma repository against a fixed interface today, in parallel with the
actual `UserService`/`RoleService`/`PermissionService` business logic
landing later.

## What is intentionally not here yet

- `dto/` folders (HTTP-facing, `class-validator`-decorated request/response
  shapes) — added when controllers/CRUD land.
- `PermissionResource` enum — deliberately not created; resource names
  (`ticket`, `booking`, ...) are per-application vocabulary and are passed as
  plain strings so this package never needs to change when an application
  adds a resource.
- Any `PrismaService` or schema — each application owns its own.
