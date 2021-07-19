import { Doc, DocKey, Either } from 'kira-nosql';

import { AuthContext, Query } from './data';
import {
  PGetNewDocIdError,
  POnStateChangedError,
  PQueryError,
  PReadDocError,
  PSetDocError,
  PUploadFileError,
} from './error';
import { Unsubscribe } from './util';

// Auth
export type SignInOption = { readonly provider: 'google'; readonly with: 'popup' };

export type PUserCredToId<UC> = (userCred: UC) => string;

export type PSignOut = () => void;

export type PSignIn = (sio: SignInOption) => void;

export type POnStateChanged<UC> = (on: {
  readonly signIn: (p: { readonly userCred: UC }) => void;
  readonly signOut: () => void;
  readonly error: (p: { readonly error: POnStateChangedError }) => void;
}) => Unsubscribe;

// DB
export type PReadDocResult =
  | { readonly state: 'exists'; readonly data: Doc }
  | { readonly state: 'notExists' };

export type PReadDoc = (key: DocKey) => Promise<Either<PReadDocResult, PReadDocError>>;

export type PGetNewDocId = (p: {
  readonly colName: string;
}) => Promise<Either<string, PGetNewDocIdError>>;

export type PSetDoc = (param: {
  readonly key: DocKey;
  readonly data: Doc;
}) => Promise<Either<undefined, PSetDocError>>;

export type PQueryResult<DBC> = {
  readonly docs: readonly { readonly key: DocKey; readonly data: Doc }[];
  readonly cursor?: DBC;
};

export type PQuery<DBC> = (
  query: Query,
  latestCursor?: DBC
) => Promise<Either<PQueryResult<DBC>, PQueryError>>;

// Storage
export type PUploadFile = (args: {
  readonly id: string;
  readonly colName: string;
  readonly fieldName: string;
  readonly file: File;
  readonly auth: AuthContext;
}) => Promise<Either<{ readonly downloadUrl: string }, PUploadFileError>>;
