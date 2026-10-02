/**
 * The authenticated caller as far as authorization is concerned. Whatever
 * authentication mechanism the application uses (JWT, session, IAM gateway)
 * is responsible for producing this; this package only consumes it.
 */
export interface IAuthenticatedIdentity {
    /** Identifier of the caller in the external IAM system. */
    iamUserId: string;
}
