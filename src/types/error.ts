import { OcToDocError } from './data';
import { PGetNewDocIdError, PSetDocError } from './provider';

export type AuthError = { readonly type: 'userNotSignedIn' };
export type CreateDocError = OcToDocError | PGetNewDocIdError | PSetDocError;
