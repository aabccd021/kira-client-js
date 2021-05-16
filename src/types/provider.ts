import { AuthContext, DocData, DocKey, OCRDocData, Query } from './data';
import { Either, Unsubscribe } from './util';

// Auth Provider
export type ApUserCredToId<UC> = (userCred: UC) => string;
export type ApSignOut = () => void;
export type ApSignIn<SIO> = (sio: SIO) => void;
export type ApOnStateChanged<AE, UC> = (on: {
  signIn: (p: { userCred: UC }) => void;
  signOut: () => void;
  error: (p: { error: AE }) => void;
}) => Unsubscribe;

// DB Provider
export type DbpReadResult = { state: 'exists'; data: DocData } | { state: 'notExists' };
export type DbpReadDoc<DBE> = (key: DocKey) => Promise<Either<DbpReadResult, DBE>>;
export type DbpGetNewDocId<DBE> = (p: { colName: string }) => Promise<Either<string, DBE>>;
export type DbpSetDoc<DBE> = (key: DocKey, docData: OCRDocData) => Promise<Either<undefined, DBE>>;
export type DbpQueryResult<DBC> = {
  docs: ReadonlyArray<{ key: DocKey; data: DocData }>;
  cursor?: DBC;
};
export type DbpQuery<DBC, DBE> = (
  query: Query,
  cursor?: DBC
) => Promise<Either<DbpQueryResult<DBC>, DBE>>;

// Storage Provider
export type SpUploadFile<SE> = (args: {
  id: string;
  colName: string;
  fieldName: string;
  file: File;
  auth: AuthContext;
}) => Promise<Either<{ downloadUrl: string }, SE>>;
