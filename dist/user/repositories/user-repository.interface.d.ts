import type { IBaseRepository, IPaginatedResult, IPaginationParams } from '../../interfaces';
import type { UserStatus } from '../enums/user-status.enum';
import type { IUser } from '../interfaces/user.interface';
/**
 * Repository-level input shapes. These describe what a repository
 * implementation accepts, not an HTTP request body — request DTOs
 * (with class-validator decorators) are a later phase.
 */
export interface ICreateUserInput {
    iamUserId: string;
    status?: UserStatus;
}
export interface IUpdateUserInput {
    status?: UserStatus;
}
/**
 * Contract a consuming application implements against its own database
 * (e.g. `PrismaUserRepository implements IUserRepository`) and binds to the
 * `USER_REPOSITORY` token via `UserRbacModule.forRoot(...)`.
 */
export interface IUserRepository extends IBaseRepository<IUser, string, ICreateUserInput, IUpdateUserInput> {
    findByIamUserId(iamUserId: string): Promise<IUser | null>;
    search(params: IPaginationParams): Promise<IPaginatedResult<IUser>>;
}
