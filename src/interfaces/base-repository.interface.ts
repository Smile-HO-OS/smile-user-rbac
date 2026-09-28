/**
 * Minimal contract every entity repository in this package implements.
 * Consuming applications (IAM, Support, Bookings, HubOps, ...) provide the
 * concrete implementation (Prisma, or otherwise) against their own database;
 * this package only ever depends on the interface.
 */
export interface IBaseRepository<TEntity, TId, TCreateInput, TUpdateInput> {
  findById(id: TId): Promise<TEntity | null>;
  create(input: TCreateInput): Promise<TEntity>;
  update(id: TId, input: TUpdateInput): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}
