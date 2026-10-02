/**
 * The authenticated caller as far as authorization is concerned. Whatever
 * authentication mechanism the application uses (JWT, session, an identity
 * provider's gateway, or just its own local login) is responsible for
 * producing this; this package only consumes it.
 */
export interface IAuthenticatedIdentity {
    /** Opaque identifier of the caller, as the application's own identity
     * resolver chooses to produce it — this package never assumes where it
     * comes from. */
    subjectId: string;
}
