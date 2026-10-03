/**
 * Minimal contract every entity repository in this package implements.
 * Consuming applications provide the concrete implementation against their
 * own database, with whatever ORM or driver they use;
 * this package only ever depends on the interface.
 */
export interface IBaseRepository<TEntity, TId, TCreateInput, TUpdateInput> {
    findById(id: TId): Promise<TEntity | null>;
    create(input: TCreateInput): Promise<TEntity>;
    update(id: TId, input: TUpdateInput): Promise<TEntity>;
    delete(id: TId): Promise<void>;
}
