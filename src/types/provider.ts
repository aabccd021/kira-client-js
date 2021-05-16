import { AuthContext, DocData, DocKey, OCRDocData, Query } from './data';
import { Either, Unsubscribe } from './util';

// Auth Provider
export type ApUserCredToId<UC> = (userCred: UC) => string;
export type ApSignOut = () => void;
export type ApSignIn<SIO> = (sio: SIO) => void;
export type ApOnStateChanged<AE, UC> = (on: {
  readonly signIn: (p: { readonly userCred: UC }) => void;
  readonly signOut: () => void;
  readonly error: (p: { readonly error: AE }) => void;
}) => Unsubscribe;

// DB Provider
export type DbpReadResult =
  | { readonly state: 'exists'; readonly data: DocData }
  | { readonly state: 'notExists' };
export type DbpReadDoc<DBE> = (key: DocKey) => Promise<Either<DbpReadResult, DBE>>;
export type DbpGetNewDocId<DBE> = (p: { readonly colName: string }) => Promise<Either<string, DBE>>;
export type DbpSetDoc<DBE> = (key: DocKey, docData: OCRDocData) => Promise<Either<undefined, DBE>>;
export type DbpQueryResult<DBC> = {
  readonly docs: ReadonlyArray<{ readonly key: DocKey; readonly data: DocData }>;
  readonly cursor?: DBC;
};
export type DbpQuery<DBC, DBE> = (
  query: Query,
  cursor?: DBC
) => Promise<Either<DbpQueryResult<DBC>, DBE>>;

// Storage Provider
export type SpUploadFile<SE> = (args: {
  readonly id: string;
  readonly colName: string;
  readonly fieldName: string;
  readonly file: File;
  readonly auth: AuthContext;
}) => Promise<Either<{ readonly downloadUrl: string }, SE>>;
