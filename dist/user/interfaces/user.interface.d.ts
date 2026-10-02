import { UserStatus } from '../enums/user-status.enum';
/**
 * Core shape of a user as owned by this package. `subjectId` links back to
 * whatever identity the consuming application's own authentication produces
 * (a central identity provider, or just that application's own local user id
 * — the package never assumes which); applications that need extra fields
 * (email, profile, application-specific mapping, ...) extend this on their
 * own side rather than this package assuming their schema.
 */
export interface IUser {
    id: string;
    subjectId: string;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}
