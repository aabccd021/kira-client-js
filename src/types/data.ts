import { Dictionary, Either, ReadDocData, ReadDocSnapshot } from 'kira-nosql';

// On Create
export type OcToDocError = { readonly type: '_' };
export type OcToDoc = (ocDoc: Dictionary<OcField>) => Promise<Either<ReadDocData, OcToDocError>>;

export type OcField = StringOcField | ImageOcField | RefOcField;

export type StringOcField = {
  readonly type: 'string';
  readonly value: string;
};

export type ImageOcField = {
  readonly type: 'image';
  readonly source:
    | {
        readonly type: 'file';
        readonly value: File;
      }
    | {
        readonly type: 'url';
        readonly value: string;
      };
};

export type RefOcField = {
  readonly type: 'ref';
  readonly dOc: ReadDocSnapshot;
};

// Query
export type Query = {
  readonly collection: string;
  readonly limit?: number;
  readonly orderByField?: string;
  readonly orderDirection?: 'asc' | 'desc';
};

// Etc
export type UserCredToDefaultDOc<UC> = (userCred: UC) => ReadDocData;

// Context
export type AuthContext =
  | {
      readonly state: 'signedIn';
      readonly id: string;
    }
  | {
      readonly state: 'signedOut';
    };
