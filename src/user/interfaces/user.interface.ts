import { UserStatus } from '../enums/user-status.enum';

/**
 * Core shape of a user as owned by this package. `iamUserId` links back to
 * the central IAM identity; applications that need extra fields (email,
 * profile, application-specific mapping, ...) extend this on their own side
 * rather than this package assuming their schema.
 */
export interface IUser {
  id: string;
  iamUserId: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
