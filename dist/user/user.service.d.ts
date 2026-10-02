import type { IPaginatedResult, IPaginationParams } from '../interfaces';
import type { IUser } from './interfaces/user.interface';
import type { ICreateUserInput, IUpdateUserInput, IUserRepository } from './repositories/user-repository.interface';
/**
 * Manages the application's local User representation, keyed to IAM via
 * `iamUserId`. This does not authenticate the user or touch IAM's own
 * record — deactivating a local user here has no effect on the global IAM
 * identity; that synchronization is a later phase.
 */
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    createUser(input: ICreateUserInput): Promise<IUser>;
    getUserById(id: string): Promise<IUser>;
    getUserByIamUserId(iamUserId: string): Promise<IUser>;
    searchUsers(params: IPaginationParams): Promise<IPaginatedResult<IUser>>;
    /**
     * General-purpose update. `IUpdateUserInput` currently only carries
     * `status`, so this and `activateUser`/`deactivateUser` cover the same
     * ground today — see the Phase 4 report for why both are kept.
     */
    updateUser(id: string, input: IUpdateUserInput): Promise<IUser>;
    activateUser(id: string): Promise<IUser>;
    deactivateUser(id: string): Promise<IUser>;
}
