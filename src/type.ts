import {
  CountFieldSpec,
  CreationTimeFieldSpec,
  Doc,
  DocKey,
  DocSnapshot,
  Field,
  ImageFieldSpec,
  RefFieldSpec,
  Spec,
  StringFieldSpec,
} from 'kira-core';
import { Dict, Either, Left, Option } from 'trimop';

/**
 *
 */
export type Listen<T> = (value: Option<T>) => undefined;

/**
 *
 */
export type Unsubscribe = () => undefined;

/**
 *
 */
export type Listenable<T> = {
  readonly listens: readonly Listen<T>[];
  readonly state: Option<T>;
};

/**
 *
 */
export type DB = Dict<Listenable<unknown>>;

/**
 *
 */
export type InvalidKeyError = {
  readonly key: string;
};

/**
 *
 */
export type ImageRField = {
  readonly url: string;
};

/**
 *
 */
export type RefRField = {
  readonly _id: string;
  // eslint-disable-next-line no-use-before-define
} & RDoc;

/**
 *
 */
export type RField = string | number | readonly string[] | Date | ImageRField | RefRField;

/**
 *
 */
export type RDoc = Dict<RField>;

/**
 *
 */
export type RToDoc = (doc: RDoc) => Doc;

/**
 *
 */
export type DocToR = (doc: Doc) => RDoc;

/**
 *
 */
export type StringCField = string;

/**
 *
 */
export type ImageCField = File | string;

/**
 *
 */
export type RefCField = RefRField;

/**
 *
 */
export type CField = StringCField | ImageCField | RefCField;

/**
 *
 */
export type CDoc = Dict<CField>;

/**
 *
 */
export type CFieldSpec =
  | ImageFieldSpec
  | StringFieldSpec
  | RefFieldSpec
  | CountFieldSpec
  | CreationTimeFieldSpec;

/**
 *
 */
export type CToFieldContext = {
  readonly col: string;
  readonly field: Option<CField>;
  readonly fieldName: string;
  readonly id: string;
};

/**
 *
 */
export type CToFieldError = { readonly _errorType: 'CToFieldError' };

/**
 *
 */
export type CToField<E extends CToFieldError> = (param: {
  readonly context: CToFieldContext;
  readonly fieldSpec: CFieldSpec;
}) => Promise<Either<E, Field>>;

/**
 *
 */
export type QueryKey = {
  readonly limit?: number;
  readonly orderByField?: string;
  readonly orderDirection?: 'asc' | 'desc';
};

/**
 *
 */
export type AuthContext =
  | {
      readonly id: string;
      readonly state: 'signedIn';
    }
  | {
      readonly state: 'signedOut';
    };

/**
 *
 */
export type KeyIsEmptyDocState = {
  readonly state: 'KeyIsEmpty';
};

export function KeyIsEmptyDocState(): KeyIsEmptyDocState {
  return { state: 'KeyIsEmpty' };
}

/**
 *
 */
export type InitializingDocState = {
  readonly state: 'Initializing';
};

export function InitializingDocState(): InitializingDocState {
  return { state: 'Initializing' };
}

/**
 *
 */
export type ContainsErrorDocState<E> = {
  readonly error: Left<E>;
  readonly revalidate: () => void;
  readonly state: 'ContainsError';
};

export function ContainsErrorDocState<E>(
  p: Omit<ContainsErrorDocState<E>, 'state'>
): ContainsErrorDocState<E> {
  return { ...p, state: 'ContainsError' };
}

/**
 *
 */
export type NotExistsDocState<C extends CDoc> = {
  readonly create: (ocDocData: C) => void;
  readonly state: 'NotExists';
};

export function NotExistsDocState<C extends CDoc>(
  p: Omit<NotExistsDocState<C>, 'state'>
): NotExistsDocState<C> {
  return { ...p, state: 'NotExists' };
}

/**
 *
 */
export type CreatingDocState = {
  readonly state: 'Creating';
};

export function CreatingDocState(p: Omit<CreatingDocState, 'state'>): CreatingDocState {
  return { ...p, state: 'Creating' };
}

/**
 *
 */
export type ReadyDocState<R extends RDoc> = {
  readonly data: R;
  readonly id: string;
  // readonly revalidate: () => void;
  readonly state: 'Ready';
};

export function ReadyDocState<R extends RDoc>(
  p: Omit<ReadyDocState<R>, 'state'>
): ReadyDocState<R> {
  return { ...p, state: 'Ready' } as ReadyDocState<R>;
}

/**
 *
 */
export type DocState<E, R extends RDoc = RDoc, C extends CDoc = CDoc> = {
  readonly state: string;
} & (
  | ContainsErrorDocState<E>
  | CreatingDocState
  | InitializingDocState
  // | KeyIsEmptyDocState
  | NotExistsDocState<C>
  | ReadyDocState<R>
);

/**
 *
 */
export type PUserCredToId<U = unknown> = (userCred: U) => string;

/**
 *
 */
export type PSignOutError = { readonly _errorType: 'PSignOutError' };

/**
 *
 */
export type PSignOut<E extends PSignOutError> = () => Either<E, Promise<void>>;

/**
 *
 */
export type PSignInError = { readonly _errorType: 'PSignInError' };

/**
 *
 */
export type PSignIn<E extends PSignInError, SIO = unknown, UC = unknown> = (
  sio: SIO
) => Either<E, Promise<UC>>;

/**
 *
 */
export type PReadDocResult =
  | { readonly data: Doc; readonly state: 'exists' }
  | { readonly state: 'notExists' };

/**
 *
 */
export type PReadDocError = { readonly _errorType: 'PReadDocError' };

/**
 *
 */
export type PReadDoc<E extends PReadDocError> = (key: DocKey) => Promise<Either<E, PReadDocResult>>;

/**
 *
 */
export type PGetNewDocIdError = { readonly _errorType: 'PGetNewDocIdError' };

/**
 *
 */
export type PGetNewDocId<E extends PGetNewDocIdError> = (p: {
  readonly col: string;
}) => Promise<Either<E, string>>;

/**
 *
 */
export type PSetDocError = { readonly _errorType: 'PSetDocError' };

/**
 *
 */
export type PSetDoc<E extends PSetDocError, R = unknown> = (param: {
  readonly data: Doc;
  readonly key: DocKey;
  readonly spec: Spec;
}) => Promise<Either<E, R>>;

/**
 *
 */
export type PQueryResult<DBC = unknown> = {
  readonly cursor?: DBC;
  readonly docs: readonly DocSnapshot[];
};

/**
 *
 */
export type PQueryError = { readonly _errorType: 'PQueryError' };

/**
 *
 */
export type PQuery<E extends PQueryError, DBC = unknown> = (param: {
  readonly col: string;
  readonly key: QueryKey;
  readonly latestCursor?: DBC;
}) => Promise<Either<E, PQueryResult<DBC>>>;

/**
 *
 */
export type PUploadImageResult = { readonly downloadUrl: string };

/**
 *
 */
export type PUploadImageError = { readonly _errorType: 'PUploadImageError' };

/**
 *
 */
export type PUploadImage<E extends PUploadImageError> = (args: {
  readonly auth: AuthContext;
  readonly col: string;
  readonly fieldName: string;
  readonly file: File;
  readonly id: string;
}) => Promise<Either<E, PUploadImageResult>>;

/**
 * UnknownCollectionNameFailure
 */
export function UnknownCollectionNameFailure(
  value: Omit<UnknownCollectionNameFailure, '_errorType'>
): UnknownCollectionNameFailure {
  return { _errorType: 'UnknownCollectionNameFailure', ...value };
}

export type UnknownCollectionNameFailure = {
  readonly _errorType: 'UnknownCollectionNameFailure';
  readonly col: string;
};

/**
 *
 */
export type CreateDocError<
  CFTE extends CToFieldError,
  PGNDI extends PGetNewDocIdError,
  PSDE extends PSetDocError
> = UnknownCollectionNameFailure | CFTE | PGNDI | PSDE;

/**
 *
 */
export type CreateDoc<
  CFTE extends CToFieldError,
  PSDE extends PSetDocError,
  PGNDI extends PGetNewDocIdError
> = (p: {
  readonly cDoc: CDoc;
  readonly col: string;
  readonly id: Option<string>;
}) => Promise<Either<CreateDocError<CFTE, PGNDI, PSDE>, string>>;
