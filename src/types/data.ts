import { Dictionary, Either, ReadDocSnapshot, ReadField } from 'kira-nosql';

import { OcToFieldError } from './error';

// On Create
export type OcToField = (ocField: OcField) => Promise<Either<ReadField, OcToFieldError>>;

export type OcDoc = Dictionary<OcField>;

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
export type UserCredToDefaultDoc<UC> = (userCred: UC) => OcDoc;

// Context
export type AuthContext =
  | {
      readonly state: 'signedIn';
      readonly id: string;
    }
  | {
      readonly state: 'signedOut';
    };
