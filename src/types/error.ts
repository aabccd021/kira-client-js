export type CreateDocError = OcToFieldError | PGetNewDocIdError | PSetDocError;

export type OcToFieldError = PUploadFileError;

// Provider
export type PReadDocError = { readonly type: 'PReadDocError ' };

export type POnStateChangedError = PReadDocError;

export type PGetNewDocIdError = { readonly type: 'PGetNewDocIdError ' };

export type PSetDocError = { readonly type: 'PSetDocError ' };

export type PQueryError = { readonly type: 'PQueryError ' };

export type PUploadFileError = { readonly type: 'PUploadFileError ' };

// State
export type DocStateError = PReadDocError;

export type CreateDocStateError = CreateDocError;

export type SignedInAuthStateError = PReadDocError;

export type SignedOutAuthStateError = PReadDocError;

export type QueryStateError = PQueryError;
