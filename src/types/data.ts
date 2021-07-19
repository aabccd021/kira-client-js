import { Dictionary, Either, Field, RefReadField, StringField } from 'kira-nosql';

import { OcToFieldError } from './error';

// On Create
export type OcToField = (param: {
  readonly ocField: OcField;
  readonly context: OcToFieldContext;
}) => Promise<Either<Field, OcToFieldError>>;

export type OcToFieldContext = {
  readonly colName: string;
  readonly fieldName: string;
  readonly id: string;
};

export type OcDoc = Dictionary<OcField>;

export type OcField = StringOcField | ImageOcField | RefOcField;

export type StringOcField = StringField;

export type ImageOcField = {
  readonly type: 'image';
  readonly source:
    | {
        readonly type: 'file';
        readonly file: File;
      }
    | {
        readonly type: 'url';
        readonly url: string;
      };
};

export type RefOcField = RefReadField;

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
