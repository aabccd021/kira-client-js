import { DocKey, Either, ReadDocData } from 'kira-nosql';

import { AuthContext, Query } from './data';
import {
  PGetNewDocIdError,
  POnStateChangedError,
  PQueryError,
  PReadDocError,
  PSetDocError,
} from './error';
import { Unsubscribe } from './util';

// Auth Provider

export type SignInOption = { readonly provider: 'google'; readonly with: 'popup' };

export type PUserCredToId<UC> = (userCred: UC) => string;

export type PSignOut = () => void;

export type PSignIn = (sio: SignInOption) => void;

export type POnStateChanged<UC> = (on: {
  readonly signIn: (p: { readonly userCred: UC }) => void;
  readonly signOut: () => void;
  readonly error: (p: { readonly error: POnStateChangedError }) => void;
}) => Unsubscribe;

// DB Provider
export type PReadDocResult =
  | { readonly state: 'exists'; readonly data: ReadDocData }
  | { readonly state: 'notExists' };

export type PReadDoc = (key: DocKey) => Promise<Either<PReadDocResult, PReadDocError>>;

export type PGetNewDocId = (p: {
  readonly colName: string;
}) => Promise<Either<string, PGetNewDocIdError>>;

export type PSetDoc = (param: {
  readonly key: DocKey;
  readonly data: ReadDocData;
}) => Promise<Either<undefined, PSetDocError>>;

export type DbpQueryResult<DBC> = {
  readonly docs: readonly { readonly key: DocKey; readonly data: ReadDocData }[];
  readonly cursor?: DBC;
};

export type PQuery<DBC> = (
  query: Query,
  latestCursor?: DBC
) => Promise<Either<DbpQueryResult<DBC>, PQueryError>>;

// Storage Provider
export type SpUploadFile<E> = (args: {
  readonly id: string;
  readonly colName: string;
  readonly fieldName: string;
  readonly file: File;
  readonly auth: AuthContext;
}) => Promise<Either<{ readonly downloadUrl: string }, E>>;
