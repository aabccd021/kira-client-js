import { AuthContext, DocData, DocKey, OCRDocData, Query } from './data';
import { Either, Unsubscribe } from './util';

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
export type DbpReadDoc<E> = (key: DocKey) => Promise<Either<DbpReadResult, E>>;
export type DbpGetNewDocId<E> = (p: { readonly colName: string }) => Promise<Either<string, E>>;
export type DbpSetDoc<E> = (key: DocKey, docData: OCRDocData) => Promise<Either<undefined, E>>;
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
