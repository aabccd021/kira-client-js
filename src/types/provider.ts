import { DocKey, Either, ReadDocData } from 'kira-nosql';

import { AuthContext, Query } from './data';
import { Unsubscribe } from './util';

// Auth Provider
export type ApUserCredToId<UC> = (userCred: UC) => string;
export type ApSignOut = () => void;
export type ApSignIn<SIO> = (sio: SIO) => void;
export type ApOnStateChanged<E, UC> = (on: {
  readonly signIn: (p: { readonly userCred: UC }) => void;
  readonly signOut: () => void;
  readonly error: (p: { readonly error: E }) => void;
}) => Unsubscribe;

// DB Provider
export type DbpReadResult =
  | { readonly state: 'exists'; readonly data: DocData }
  | { readonly state: 'notExists' };

export type PReadDocError = {
  readonly type: 'readDoc';
};
export type PReadDoc = (key: DocKey) => Promise<Either<DbpReadResult, PReadDocError>>;

export type PGetNewDocIdError = {
  readonly type: 'getNewDocId';
};

export type PGetNewDocId = (p: {
  readonly colName: string;
}) => Promise<Either<string, PGetNewDocIdError>>;

export type PSetDocError = {
  readonly type: 'setDoc';
};

export type PSetDoc = (param: {
  readonly key: DocKey;
  readonly data: ReadDocData;
}) => Promise<Either<undefined, PSetDocError>>;

export type DbpQueryResult<DBC> = {
  readonly docs: ReadonlyArray<{ readonly key: DocKey; readonly data: DocData }>;
  readonly cursor?: DBC;
};
export type DbpQuery<DBC, E> = (
  query: Query,
  cursor?: DBC
) => Promise<Either<DbpQueryResult<DBC>, E>>;

// Storage Provider
export type SpUploadFile<E> = (args: {
  readonly id: string;
  readonly colName: string;
  readonly fieldName: string;
  readonly file: File;
  readonly auth: AuthContext;
}) => Promise<Either<{ readonly downloadUrl: string }, E>>;
