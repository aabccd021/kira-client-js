import { Dictionary } from './util';

// Document Key
export type DocKey<C extends string = string> = { collection: C; id: string };

// Document Key
export type Doc<C extends string = string, T extends DocData = DocData> = DocKey<C> & T;

// ON READ LOCAL document data
export type DocData = { [key: string]: DocDataField };
export type DocDataField = string | number | Date | DocImageField | DocReferenceField;
export type DocReferenceField = { id: string } & DocData;

// ON CREATE LOCAL document data
export type OCDocData = { [key: string]: OCDocField };
export type OCDocField = string | { file: File } | DocImageField | { id: string };

// ON CREATE REMOTE document data
export type OCRDocData = { [key: string]: OCRDocDataField };
export type OCRDocDataField =
  | OCRStringField
  | OCRCountField
  | OCRImageField
  | OCRCreationTimeField
  | OCRReferenceField
  | OCROwnerField;
export type OCRStringField = {
  type: 'string';
  value: string;
};
export type OCRCountField = {
  type: 'count';
  countedCol: string;
  groupByRef: string;
};
export type OCRImageField = {
  type: 'image';
  value: { url: string };
};
export type OCRCreationTimeField = {
  type: 'creationTime';
};
export type OCROwnerField = {
  type: 'owner';
  syncFields?: Dictionary<true>;
  value: { id: string; user: DocData };
};
// TODO: rename to ref, use interop
export type OCRReferenceField = {
  type: 'ref';
  refCol: string;
  syncFields?: Dictionary<true>;
  value: { id: string; doc: DocData };
};

// Fields
export type DocImageField = { url: string };

// Query
export type Query<T extends string = string> = {
  collection: T;
  limit?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
};

// Etc
export type UserCredToDefaultDoc<UC, T extends OCDocData = OCDocData> = (userCred: UC) => T;

// Context
export type AuthContext =
  | {
      state: 'signedIn';
      id: string;
    }
  | {
      state: 'signedOut';
    };
