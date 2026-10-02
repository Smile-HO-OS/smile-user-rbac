export interface IPaginationParams {
    page: number;
    pageSize: number;
}
export interface IPaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
