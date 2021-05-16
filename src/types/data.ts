import { Dictionary } from './util';

// Document Key
export type DocKey<C extends string = string> = { readonly collection: C; readonly id: string };

// Document Key
export type Doc<C extends string = string, T extends DocData = DocData> = DocKey<C> & T;

// ON READ LOCAL document data
export type DocData = { readonly [key: string]: DocDataField };
export type DocDataField = string | number | Date | DocImageField | DocReferenceField;
export type DocReferenceField = { readonly id: string } & DocData;

// ON CREATE LOCAL document data
export type OCDocData = { readonly [key: string]: OCDocField };
export type OCDocField = string | { readonly file: File } | DocImageField | { readonly id: string };

// ON CREATE REMOTE document data
export type OCRDocData = { readonly [key: string]: OCRDocDataField };
export type OCRDocDataField =
  | OCRStringField
  | OCRCountField
  | OCRImageField
  | OCRCreationTimeField
  | OCRReferenceField
  | OCROwnerField;
export type OCRStringField = {
  readonly type: 'string';
  readonly value: string;
};
export type OCRCountField = {
  readonly type: 'count';
  readonly countedCol: string;
  readonly groupByRef: string;
};
export type OCRImageField = {
  readonly type: 'image';
  readonly value: { readonly url: string };
};
export type OCRCreationTimeField = {
  readonly type: 'creationTime';
};
export type OCROwnerField = {
  readonly type: 'owner';
  readonly syncFields?: Dictionary<true>;
  readonly value: { readonly id: string; readonly user: DocData };
};
// TODO: rename to ref, use interop
export type OCRReferenceField = {
  readonly type: 'ref';
  readonly refCol: string;
  readonly syncFields?: Dictionary<true>;
  readonly value: { readonly id: string; readonly doc: DocData };
};

// Fields
export type DocImageField = { readonly url: string };

// Query
export type Query<T extends string = string> = {
  readonly collection: T;
  readonly limit?: number;
  readonly orderByField?: string;
  readonly orderDirection?: 'asc' | 'desc';
};

// Etc
export type UserCredToDefaultDoc<UC, T extends OCDocData = OCDocData> = (userCred: UC) => T;

// Context
export type AuthContext =
  | {
      readonly state: 'signedIn';
      readonly id: string;
    }
  | {
      readonly state: 'signedOut';
    };
