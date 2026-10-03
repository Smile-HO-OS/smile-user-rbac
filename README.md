# @shree-maruti/nestjs-user-rbac

Reusable User + RBAC (Role-Based Access Control) backend module for Shree
Maruti's NestJS applications (IAM, Support, Bookings, HubOps, and future
apps). **Status: v1.0.0, live in production in IAM.** User/Role/Permission
management, authorization (`User → Roles → Permissions → Allow/Deny`),
guards and decorators are all implemented — see
[`docs/architecture.md`](docs/architecture.md) for the full design and
[`docs/integration-guide.md`](docs/integration-guide.md) for a deeper
integration walkthrough than this README covers.

## Why a shared package

User identity, roles and permissions are the same concept across every
Shree Maruti application, but each application owns its own database (and
not necessarily the same kind of database). Rather than every app
reimplementing `UserService`/`RoleService`/`PermissionService`/
`AuthorizationService` against its own schema, this package defines the
shared logic once; each application supplies its own repository
implementation.

## Why `nestjs-user-rbac` over `user-rbac`

The package is coupled to NestJS from the ground up (`@Module`,
`@Injectable`, `@Inject`, dynamic modules) — it is not a framework-agnostic
core with a thin Nest adapter. Naming it `nestjs-user-rbac` says that
plainly up front (in line with the community convention of `nestjs-*`
packages) and leaves `@shree-maruti/user-rbac` free later if a
framework-agnostic core is ever split out.

## What's in the box

| Reusable (same code in every app)                                                                 | Required per-app adapter (you write this)                                             |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `UserService`, `RoleService`, `PermissionService` — CRUD, search, activate/deactivate, assignment | 5 repository classes implementing the package's interfaces                            |
| `AuthorizationService` — the actual `User → Roles → Permissions → Allow/Deny` decision            | 1 identity resolver mapping your app's authenticated-request shape to `{ subjectId }` |
| `PermissionGuard` / `RoleGuard` — route guards                                                    | —                                                                                     |
| `@RequirePermission()` / `@RequireRole()` — decorators                                            | —                                                                                     |
| `UserRbacModule.forRoot(...)` — the composition root                                              | The `forRoot(...)` call itself, in your `AppModule`                                   |

No file in `src/` imports Prisma, a database client, or any application's
schema — the package only depends on the five repository **interfaces**,
injected through `Symbol` DI tokens. This is what makes it usable
regardless of which ORM/ODM (or none at all — raw SQL is fine too) your
application uses.

## Installation

No npm registry or GitHub organization is required — install directly from
the git tag:

```bash
npm install github:mahak-smile/smile-user-rbac#v1.0.0
```

or in `package.json`:

```json
"@shree-maruti/nestjs-user-rbac": "github:mahak-smile/smile-user-rbac#v1.0.0"
```

This requires the same GitHub access a plain `git clone` of this repo would
— nothing more. Peer dependencies (`@nestjs/common`, `@nestjs/core`,
`reflect-metadata`, `rxjs`) must already be in your app, at the versions in
[`package.json`](package.json).

To pick up a fix or a new version later: update the tag in your dependency
string and run `npm install` again. See [Releasing](#releasing-this-package)
below for how new versions get cut.

## Setup — Case A: a fresh application (no existing users)

Six new files, plus two small schema additions. Nothing here is
ORM-specific — the examples below use Prisma-flavored pseudocode because
that's this package's first production consumer (IAM), but the actual
query calls are entirely up to you; see
[ORM/ODM-agnostic notes](#ormodm-agnostic-notes) below for a document-database
example.

```text
src/modules/rbac/
├── rbac.module.ts                    — forRoot() wiring
├── identity.resolver.ts              — maps request.user → { subjectId }
└── repositories/
    ├── user.repository.ts            — implements IUserRepository
    ├── role.repository.ts            — implements IRoleRepository
    ├── permission.repository.ts      — implements IPermissionRepository
    ├── user-role.repository.ts       — implements IUserRoleRepository
    └── role-permission.repository.ts — implements IRolePermissionRepository
```

**1. Add the tables.** `User` (if you don't already have one), `Role`,
`Permission`, `UserRole`, `RolePermission` — shapes in
[`docs/architecture.md`](docs/architecture.md)'s ER diagram. Pick your own
permission-code vocabulary (e.g. `'orders.create'`, `'invoices.view'`) —
plain strings, no required format.

**2. Write the identity resolver:**

```ts
@Injectable()
export class AppIdentityResolver implements IIdentityResolver {
  resolve(context: ExecutionContext): IAuthenticatedIdentity | undefined {
    const user = context
      .switchToHttp()
      .getRequest<{ user?: { id?: string } }>().user;
    return user?.id ? { subjectId: user.id } : undefined;
  }
}
```

Map whatever your own JWT/session already puts on `request.user` — `id`,
`sub`, `userId`, whatever it is. The field is always called `subjectId` on
the package's side regardless of what your app calls it; it's just an
opaque identity string, not a dependency on IAM itself.

**3. Write the five repositories** (one shown; the other four follow the
same shape — see the interface files under `src/*/repositories/` for the
exact method signatures each one needs):

```ts
@Injectable()
export class AppUserRepository implements IUserRepository {
  constructor(private readonly db: YourDbClient) {}

  async findById(id: string) {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? toIUser(row) : null;
  }
  findBySubjectId(id: string) {
    return this.findById(id);
  }
  async create(input: ICreateUserInput) {
    /* insert, map row -> IUser */
  }
  async update(id: string, input: IUpdateUserInput) {
    /* update, map row -> IUser */
  }
  async delete(id: string) {
    /* delete */
  }
  async search(params: IPaginationParams) {
    /* paginated query + count */
  }
}
```

**4. Wire it up:**

```ts
@Module({
  imports: [
    UserRbacModule.forRoot({
      userRepositoryProvider: {
        provide: USER_REPOSITORY,
        useClass: AppUserRepository,
      },
      roleRepositoryProvider: {
        provide: ROLE_REPOSITORY,
        useClass: AppRoleRepository,
      },
      permissionRepositoryProvider: {
        provide: PERMISSION_REPOSITORY,
        useClass: AppPermissionRepository,
      },
      userRoleRepositoryProvider: {
        provide: USER_ROLE_REPOSITORY,
        useClass: AppUserRoleRepository,
      },
      rolePermissionRepositoryProvider: {
        provide: ROLE_PERMISSION_REPOSITORY,
        useClass: AppRolePermissionRepository,
      },
      identityResolverProvider: {
        provide: IDENTITY_RESOLVER,
        useClass: AppIdentityResolver,
      },
    }),
  ],
  exports: [UserRbacModule],
})
export class RbacModule {}
```

Import `RbacModule` in your `AppModule`, then register the package's own
guard globally:

```ts
providers: [{ provide: APP_GUARD, useClass: PermissionGuard }];
```

**5. Guard routes directly:**

```ts
@Post()
@RequirePermission('orders.create')
create(@Body() dto: CreateOrderDto) { /* ... */ }
```

That's the whole setup. See [How to use it](#how-to-use-it-once-wired) below
for day-to-day usage (creating roles, assigning permissions, programmatic
checks).

## Setup — Case B: an existing application with an existing user base

The same six files — but written as **additive adapters around data that
already exists**, not a replacement. This is exactly the path IAM took,
with thousands of existing users and its own pre-existing permission model,
and the whole migration ran with zero downtime and zero changes to
existing behavior until the final, verified cutover.

**Nothing about your existing tables changes structurally**, except
possibly two new, nullable columns on `Role` if it doesn't already have
something equivalent:

| Existing thing                                    | What happens                                                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Your `User` table                                 | **Untouched.** The repository adapter reads it as-is. No status concept? Report everyone as `ACTIVE` in the mapper — no column needed. |
| Your `Role` table                                 | **Untouched structurally**, except two new nullable columns if missing: a stable `code` string and a `status`.                         |
| Permission / role-permission / user-role concepts | **New tables only**, added purely for this package — they add capability, they don't replace anything.                                 |

**If your app already has its own permission system** (a JSON blob of
flags, a flat `permissions` array, whatever), follow this order:

1. **Add the new tables**, leave your existing admin UI and existing
   enforcement exactly as they are.
2. **Backfill once**: populate the new tables from whatever your existing
   permission data looks like today. The expensive part is small — one row
   per _role_ for permissions, one row per _user_ only for the role
   assignment itself (a bulk mirror of a `roleId`-style column). This is an
   indexed-lookup problem at runtime, not something that scales with user
   count.
3. **Keep your existing write path as the source of truth**, mirroring
   every role/permission edit into the new tables too (a small "sync"
   function called after each save — see IAM's `rbac-sync.ts` for a worked
   example of this exact pattern).
4. **Optionally, validate in shadow mode first**: call
   `AuthorizationService.hasPermission()` alongside your existing check,
   log any disagreement, never let it affect the actual response. Run this
   in staging or production for a while before trusting it — this is a
   real, deliberate safety net for exactly the "thousands of existing
   users, can't risk it" scenario.
5. **Cut over the guard only once you've verified parity.** At that point
   it's a guard swap behind the same routes — same request/response
   contracts, same error semantics if you want them, zero visible change
   for anyone already using the app. This was verified for IAM with real
   HTTP requests against real production-shaped data before going live.

The IAM-specific `rbac-sync.ts`/backfill-script pattern this describes
lives in IAM's own repo (not in this package, deliberately — it's
migration glue specific to IAM's prior system, not something every
consumer needs). Ask whoever maintains that repo for the worked example if
you want to copy the shape of it.

**The `create`/`delete` methods on your user repository can simply reject**
if your app already has its own user-provisioning flow that must stay
authoritative — exactly what IAM's adapter does:

```ts
create(): Promise<IUser> {
  return Promise.reject(new Error('Users are created by this app\'s own UsersService'));
}
```

## ORM/ODM-agnostic notes

Every example above happens to use SQL/Prisma-flavored pseudocode, but
nothing in the package cares. The only contract is: implement the five
interfaces, return data shaped like `IUser`/`IRole`/`IPermission`/
`IUserRole`/`IRolePermission` (all plain objects with `string` ids — not
`ObjectId`, not `bigint`; convert at the adapter boundary). A document
database works the same way, just with different queries inside the same
methods:

```ts
// Mongoose / MongoDB example — same IUserRepository contract
@Injectable()
export class AppUserRepository implements IUserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findById(id: string) {
    const doc = await this.userModel.findById(id).lean();
    return doc
      ? {
          id: doc._id.toString(),
          subjectId: doc._id.toString(),
          status: doc.status,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }
      : null;
  }
  findBySubjectId(id: string) {
    return this.findById(id);
  }
  // create/update/delete/search follow the same shape, using Mongoose's own API
}
```

`UserRole`/`RolePermission` don't need to be separate collections in a
document database either — they can be embedded arrays on the `Role`/`User`
documents, as long as the repository methods (`assign`, `remove`,
`findRolesByUserId`, etc.) still return/accept the shapes the interfaces
expect. The package never sees your storage choice, only the interface.

## How to use it (once wired)

**Admin-side: manage roles and permissions**

```ts
const permission = await permissionService.createPermission({
  code: 'orders.create',
  resource: 'orders',
  action: PermissionAction.CREATE,
  description: 'Create orders',
});
const role = await roleService.createRole({
  name: 'Order Manager',
  code: 'order_manager',
  description: '...',
});
await permissionService.assignPermissionToRole(role.id, permission.id);
await roleService.assignRoleToUser(user.id, role.id);
```

**Declarative route guarding** (most routes — this is what `PermissionGuard`
reads):

```ts
@Post()
@RequirePermission('orders.create')
create() { /* ... */ }

@Delete(':id')
@RequirePermission('orders.delete', 'orders.audit') // ALL listed codes required
@RequireRole('order_manager')                       // stack both guards + decorators to require both
remove() { /* ... */ }
```

**Programmatic checks** (outside HTTP, or for conditional logic inside one
handler):

```ts
const allowed = await authorizationService.hasPermission(
  userId,
  'orders.create',
); // true/false — see "Errors and edge cases" below for what can still reject
await authorizationService.authorize(userId, 'orders.create'); // throws AuthorizationDeniedException if denied
const roles = await authorizationService.getUserRoles(userId);
const permissions = await authorizationService.getUserPermissions(userId);
```

Only **active** users, roles and permissions count toward a decision — an
inactive user, an inactive role they hold, or an inactive permission a role
grants are all treated as "not granted," never as an error. A user's
permissions are the union of every active role's active permissions,
de-duplicated by permission `code`.

### Multiple codes: ALL are required

`@RequirePermission('a', 'b')` and `@RequireRole('x', 'y')` mean **every**
listed code must be held (AND, not OR). There is no "any of" form. To allow
either of two permissions, define a permission/role that covers both, or
check programmatically with `hasPermission`. A method-level decorator
**replaces** a class-level one (it does not merge). A route with no
decorator is not restricted by the guard.

### Errors and edge cases

| Situation                                                              | `PermissionGuard` / `RoleGuard`       | `AuthorizationService` called directly                                  |
| ---------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| No identity (resolver returns nothing, or blank `subjectId`)           | `401 UnauthorizedException`           | n/a                                                                     |
| Identity has no local user                                             | `403 ForbiddenException`              | `hasPermission` → `false`; `authorize` → denial (403); `get*` → `[]`    |
| Permission/role not held, or user/role/permission inactive             | `403 ForbiddenException`              | `hasPermission` → `false`; `authorize` → `AuthorizationDeniedException` |
| Blank `userId` / `permissionCode`, bad pagination, invalid code format | n/a                                   | `BadRequestException` (400)                                             |
| Repository / database failure                                          | propagated unchanged (not turned 403) | propagated unchanged                                                    |

`hasPermission()` returns a boolean for **any** user id: an unknown or
inactive user is simply `false`. It rejects only for blank arguments (400)
and repository failures. `AuthorizationDeniedException` is a
`ForbiddenException`, so it is a 403 with no mapping needed on your side.
Both guards load the caller's permissions/roles once per request, however
many codes are listed.

The guards and the default `RequestIdentityResolver` are for **HTTP**
requests (they read `request.user`). Use `AuthorizationService` directly
from other transports (queues, CLI jobs).

`UserRbacModule.forRoot(...)` must be imported **once** per application
(typically from a single `RbacModule` that re-exports it). Importing it in
several modules creates separate repository instances. The package cannot
detect this at runtime without global state that would break parallel test
modules, so it is a documented rule, not an enforced one.

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
commitlint, using the standard Conventional Commits rules.

## Releasing this package

This package is consumed as a git dependency, not published to a registry
— `dist/` is therefore committed deliberately (npm's script-security
defaults block the build-on-install step for a plain git dependency, so
there's nothing to build it on the consumer's side). To cut a new version:

```bash
# bump "version" in package.json first, then:
rm -rf dist tsconfig.build.tsbuildinfo
npm run build
git add -A dist package.json
git commit -m "chore: release vX.Y.Z"
git tag -a vX.Y.Z -m "..."
git push origin main
git push origin vX.Y.Z
```

Consumers pick it up by changing the tag in their own `package.json` and
running `npm install` — nothing else to coordinate.

## Further reading

- [`docs/architecture.md`](docs/architecture.md) — component diagram, data
  model, request-flow sequence diagram, guard behaviour table.
- [`docs/integration-guide.md`](docs/integration-guide.md) — a slower,
  more exhaustive walkthrough of the same integration steps as this README.
