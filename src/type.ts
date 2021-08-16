import { Doc, DocKey, DocSnapshot, Field, FieldSpec, Spec } from 'kira-core';
import { Dict, Either, Left, Option } from 'trimop';

import { Task } from './trimop/pipe';

/**
 *
 */
export type Listen<T> = (value: Option<T>) => void;

/**
 *
 */
export type Unsubscribe = () => void;

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
export type QueryKey = {
  readonly limit?: number;
  readonly orderByField?: string;
  readonly orderDirection?: 'asc' | 'desc';
};

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
export type PSignOut<E extends PSignOutError> = () => Either<E, Task<void>>;

/**
 *
 */
export type PSignInError = { readonly _errorType: 'PSignInError' };

/**
 *
 */
export type PSignIn<E extends PSignInError, SIO = unknown, UC = unknown> = (
  sio: SIO
) => Either<E, Task<UC>>;

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
export type PReadDoc<E extends PReadDocError = PReadDocError> = (
  key: DocKey
) => Task<Either<E, PReadDocResult>>;

/**
 *
 */
export type PGetNewDocIdError = { readonly _errorType: 'PGetNewDocIdError' };

/**
 *
 */
export type PGetNewDocId<E extends PGetNewDocIdError = PGetNewDocIdError> = (p: {
  readonly col: string;
}) => Task<Either<E, string>>;

/**
 *
 */
export type PSetDocError = { readonly _errorType: 'PSetDocError' };

/**
 *
 */
export type PSetDoc<E extends PSetDocError = PSetDocError, R = unknown> = (param: {
  readonly doc: Doc;
  readonly key: DocKey;
  readonly spec: Spec;
}) => Task<Either<E, R>>;

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
export type PQuery<E extends PQueryError = PQueryError, DBC = unknown> = (param: {
  readonly col: string;
  readonly key: QueryKey;
  readonly latestCursor?: DBC;
}) => Task<Either<E, PQueryResult<DBC>>>;

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
export type PUploadImage<E extends PUploadImageError = PUploadImageError> = (args: {
  readonly col: string;
  readonly fieldName: string;
  readonly file: File;
  readonly id: string;
}) => Task<Either<E, PUploadImageResult>>;

/**
 *
 * RField
 *
 */
export type StringRField = string;

export type NumberRField = string;

export type DateRField = Date;

export type ImageRField = {
  readonly url: string;
};

export type RefRField = {
  readonly _id: string;
  // eslint-disable-next-line no-use-before-define
} & RDoc;

export type RField = StringRField | NumberRField | DateRField | ImageRField | RefRField;

/**
 *
 */
export type RDoc = Dict<RField>;

/**
 *
 * RToDocError
 *
 */
export type InvalidTypeRToDocError = {
  readonly _errorType: 'InvalidTypeError';
  readonly col: string;
  readonly field: unknown;
  readonly fieldName: string;
  readonly message?: string;
};

export type NeverRToDocError = {
  readonly _errorType: 'NeverError';
  readonly never: unknown;
};

export type RToDocError = InvalidTypeRToDocError | NeverRToDocError;

export function invalidTypeRToDocError(p: {
  readonly col: string;
  readonly field: unknown;
  readonly fieldName: string;
  readonly message?: string;
}): RToDocError {
  return {
    ...p,
    _errorType: 'InvalidTypeError',
  };
}

export function neverRToFieldError(never: unknown): NeverRToDocError {
  return {
    _errorType: 'NeverError',
    never,
  };
}

/**
 *
 */
export type RToFieldCtx = {
  readonly col: string;
  readonly field: Option<RField>;
  readonly fieldName: string;
};

/**
 *
 */
export type RToField<E extends RToDocError> = (param: {
  readonly Ctx: RToFieldCtx;
  readonly fieldSpec: FieldSpec;
}) => Either<E, Option<Field>>;

/**
 *
 */
export type RToDoc<E extends RToDocError = RToDocError> = (
  col: string,
  rDoc: RDoc
) => Either<E, Option<Doc>>;

/**
 *
 */
export type DocToR = (doc: Doc) => RDoc;

/**
 *
 * CField
 *
 */
export type StringCField = string;

export type ImageCField = File | string;

export type RefCField = RefRField;

export type CField = StringCField | ImageCField | RefCField;

/**
 *
 */
export type CDoc = Dict<CField>;

/**
 *
 * CToFieldError
 *
 */
export type UploadImageCToFieldError<PUIE extends PUploadImageError> = {
  readonly _errorType: 'UploadImageError';
  readonly uploadImageError: PUIE;
};

export type UserNotSignedInCToFieldError = {
  readonly _errorType: 'UserNotSignedInError';
  readonly signInRequired: string;
};

export type RToDocCToFieldError = {
  readonly _errorType: 'RToDocError';
  readonly rToDocError: RToDocError;
};

export type NeverCToFieldError = {
  readonly _errorType: 'NeverError';
  readonly never: never;
};

export type InvalidTypeCToFieldError = {
  readonly _errorType: 'InvalidTypeCToFieldError';
  readonly col: string;
  readonly field: unknown;
  readonly fieldName: string;
  readonly message?: string;
};

export type CToFieldError<PUIE extends PUploadImageError = PUploadImageError> =
  | UploadImageCToFieldError<PUIE>
  | UserNotSignedInCToFieldError
  | RToDocCToFieldError
  | NeverCToFieldError
  | InvalidTypeCToFieldError;

export function uploadImageCToFieldError<PUIE extends PUploadImageError>(
  uploadImageError: PUIE
): UploadImageCToFieldError<PUIE> {
  return {
    _errorType: 'UploadImageError',
    uploadImageError,
  };
}

export function userNotSignedInCToFieldError(signInRequired: string): UserNotSignedInCToFieldError {
  return {
    _errorType: 'UserNotSignedInError',
    signInRequired,
  };
}

export function rToDocCToFieldError(rToDocError: RToDocError): RToDocCToFieldError {
  return {
    _errorType: 'RToDocError',
    rToDocError,
  };
}

export function neverCToFieldError(never: never): NeverCToFieldError {
  return {
    _errorType: 'NeverError',
    never,
  };
}

export function invalidTypeCToFieldError(p: {
  readonly col: string;
  readonly field: unknown;
  readonly fieldName: string;
  readonly message?: string;
}): InvalidTypeCToFieldError {
  return {
    ...p,
    _errorType: 'InvalidTypeCToFieldError',
  };
}

/**
 *
 */
export type CToFieldCtx = {
  readonly col: string;
  readonly field: Option<CField>;
  readonly fieldName: string;
  readonly id: string;
};

/**
 *
 */
export type CToField<E extends CToFieldError> = (param: {
  readonly Ctx: CToFieldCtx;
  readonly fieldSpec: FieldSpec;
}) => Task<Either<E, Option<Field>>>;

/**
 *
 * CreateDocError
 *
 */
export type PSetDocCreateDocError<PSDE extends PSetDocError> = {
  readonly _errorType: 'PSetDocError';
  readonly error: PSDE;
};

export type UnknownColCreateDocError = {
  readonly _errorType: 'UnknownColError';
  readonly col: string;
};

export type CToFieldCreateDocError<CTFE extends CToFieldError> = {
  readonly _errorType: 'CToFieldError';
  readonly err: CTFE;
};

export type PGetNewDocIdCreateDocError<PGNIE extends PGetNewDocIdError> = {
  readonly _errorType: 'PGetNewDocIdError';
  readonly err: PGNIE;
};

export type CreateDocError<
  PSDE extends PSetDocError = PSetDocError,
  CTFE extends CToFieldError = CToFieldError,
  PGNIE extends PGetNewDocIdError = PGetNewDocIdError
> = { readonly _errorType: string } & (
  | PSetDocCreateDocError<PSDE>
  | UnknownColCreateDocError
  | CToFieldCreateDocError<CTFE>
  | PGetNewDocIdCreateDocError<PGNIE>
);

export function cToFieldCreateDocError<CTFE extends CToFieldError>(err: CTFE): CreateDocError {
  return { _errorType: 'CToFieldError', err };
}

export function pGetNewDocIdCreateDocError<PGNIE extends PGetNewDocIdError>(
  err: PGNIE
): CreateDocError {
  return { _errorType: 'PGetNewDocIdError', err };
}

export function unknownColCreateDocError(col: string): CreateDocError {
  return { _errorType: 'UnknownColError', col };
}

export function pSetDocCreateDocError<PSDE extends PSetDocError>(error: PSDE): CreateDocError {
  return { _errorType: 'PSetDocError', error };
}

/**
 *
 */
export type CreateDoc = (p: {
  readonly cDoc: CDoc;
  readonly col: string;
  readonly id: Option<string>;
}) => Task<Either<CreateDocError, DocSnapshot>>;

/**
 *
 * DocStateError
 *
 */
export type CreateDocDocStateError<CDE extends CreateDocError> = {
  readonly _errorType: 'CreateDocError';
  readonly createDocError: CDE;
};

export type PReadDocDocStateError<PRDE extends PReadDocError> = {
  readonly _errorType: 'PReadDocError';
  readonly readDocError: PRDE;
};

export type DocStateError<
  PRDE extends PReadDocError = PReadDocError,
  CDE extends CreateDocError = CreateDocError
> = {
  readonly _errorType: string;
} & (CreateDocDocStateError<CDE> | PReadDocDocStateError<PRDE>);

export function createDocDocStateError<CDE extends CreateDocError>(
  createDocError: CDE
): DocStateError {
  return { _errorType: 'CreateDocError', createDocError };
}

export function pReadDocDocStateError<PRDE extends PReadDocError>(
  readDocError: PRDE
): DocStateError {
  return { _errorType: 'PReadDocError', readDocError };
}

/**
 *
 * DocState
 *
 */
export type ContainsErrorDocState<E extends DocStateError> = {
  readonly error: Left<E>;
  readonly revalidate: () => void;
  readonly state: 'ContainsError';
};

export type CreatingDocState = {
  readonly state: 'Creating';
};

export type InitializingDocState = {
  readonly state: 'Initializing';
};

export type KeyIsEmptyDocState = {
  readonly state: 'KeyIsEmpty';
};

export type NotExistsDocState<C extends CDoc> = {
  readonly create: (ocDocData: C) => void;
  readonly state: 'NotExists';
};

export type ReadyDocState<R extends RDoc> = {
  readonly data: R;
  readonly id: string;
  /**
   * TODO
   * readonly revalidate: () => void;
   */
  readonly state: 'Ready';
};

export type DocState<
  E extends DocStateError = DocStateError,
  R extends RDoc = RDoc,
  C extends CDoc = CDoc
> = {
  readonly state: string;
} & (
  | ContainsErrorDocState<E>
  | CreatingDocState
  | InitializingDocState
  | KeyIsEmptyDocState
  | NotExistsDocState<C>
  | ReadyDocState<R>
);

export function containsErrorDocState<E extends DocStateError>(p: {
  readonly error: Left<E>;
  readonly revalidate: () => void;
}): ContainsErrorDocState<E> {
  return { ...p, state: 'ContainsError' };
}

export function creatingDocState(): CreatingDocState {
  return { state: 'Creating' };
}

export function initializingDocState(): InitializingDocState {
  return { state: 'Initializing' };
}

export function keyIsEmptyDocState(): KeyIsEmptyDocState {
  return { state: 'KeyIsEmpty' };
}

export function notExistsDocState<C extends CDoc>(
  create: (ocDocData: C) => void
): NotExistsDocState<C> {
  return { create, state: 'NotExists' };
}

export function readyDocState<R extends RDoc>(p: {
  readonly data: R;
  readonly id: string;
}): ReadyDocState<R> {
  return { ...p, state: 'Ready' };
}

/**
 *
 * DocStateCtx
 *
 */
export type ContainsErrorDocStateCtx<E extends DocStateError> = {
  readonly error: Left<E>;
  readonly key: DocKey;
  readonly state: 'ContainsError';
};

export type CreatingDocStateCtx = {
  readonly state: 'Creating';
};

export type InitializingDocStateCtx = {
  readonly state: 'Initializing';
};

export type KeyIsEmptyDocStateCtx = {
  readonly state: 'KeyIsEmpty';
};

export type NotExistsDocStateCtx = {
  readonly key: DocKey;
  readonly state: 'NotExists';
};

export type ReadyDocStateCtx<R extends RDoc> = {
  readonly data: R;
  readonly id: string;
  readonly state: 'Ready';
};

export type DocStateCtx<E extends DocStateError = DocStateError, R extends RDoc = RDoc> = {
  readonly state: string;
} & (
  | ContainsErrorDocStateCtx<E>
  | CreatingDocStateCtx
  | InitializingDocStateCtx
  | KeyIsEmptyDocStateCtx
  | NotExistsDocStateCtx
  | ReadyDocStateCtx<R>
);

export function containsErrorDocStateCtx<E extends DocStateError>(
  key: DocKey
): (error: Left<E>) => DocStateCtx {
  return (error) => ({ error, key, state: 'ContainsError' });
}

export function creatingDocStateCtx(): DocStateCtx {
  return { state: 'Creating' };
}

export function initializingDocStateCtx(): DocStateCtx {
  return { state: 'Initializing' };
}

export function keyIsEmptyDocStateCtx(): DocStateCtx {
  return { state: 'KeyIsEmpty' };
}

export function notExistsDocStateCtx(key: DocKey): DocStateCtx {
  return { key, state: 'NotExists' };
}

export function readyDocStateCtx<R extends RDoc>(p: {
  readonly data: R;
  readonly id: string;
}): DocStateCtx {
  return { ...p, state: 'Ready' };
}

/**
 *
 */
export type SetDocState<
  E extends DocStateError = DocStateError,
  R extends RDoc = RDoc,
  C extends CDoc = CDoc
> = (key: DocKey) => (newDocState: DocState<E, R, C>) => void;

/**
 *
 */
export type GetDocStateCtxIfAbsent = (key: DocKey) => Task<DocStateCtx>;

/**
 *
 */
export type State<T> = {
  readonly effectOnInit: () => Option<Unsubscribe>;
  readonly initialState: T;
  readonly subscribe: (listen: (t: T) => void) => Unsubscribe;
};

/**
 *
 */
export type AuthStateError = { readonly _errorType: 'AuthStateError' };

/**
 *
 * Auth State
 *
 */
export type InitializingAuthState = {
  readonly state: 'initializing';
};

export type SignedInAuthState<E extends AuthStateError, URD extends RDoc> = {
  readonly error?: Left<E>;
  readonly signOut: () => void;
  readonly state: 'signedIn';
  readonly user: URD;
  readonly userId: string;
};

export type LoadingUserDataAuthState = {
  readonly signOut: () => void;
  readonly state: 'loadingUserData';
  readonly userId: string;
};

export type SignedOutAuthState<E extends AuthStateError, SIO> = {
  readonly error?: Left<E>;
  readonly signIn: (option: SIO) => void;
  readonly state: 'signedOut';
};

export type AuthState<
  ASE extends AuthStateError = AuthStateError,
  SIO = unknown,
  URD extends RDoc = RDoc
> =
  | InitializingAuthState
  | SignedOutAuthState<ASE, SIO>
  | LoadingUserDataAuthState
  | SignedInAuthState<ASE, URD>;

export function InitializingAuthState(): InitializingAuthState {
  return { state: 'initializing' };
}

export function signedInAuthState<E extends AuthStateError, URD extends RDoc>(p: {
  readonly error?: Left<E>;
  readonly signOut: () => void;
  readonly user: URD;
  readonly userId: string;
}): SignedInAuthState<E, URD> {
  return { ...p, state: 'signedIn' };
}

export function loadingUserDataAuthState(p: {
  readonly signOut: () => void;
  readonly userId: string;
}): LoadingUserDataAuthState {
  return { ...p, state: 'loadingUserData' };
}

export function signedOutAuthState<E extends AuthStateError, SIO>(p: {
  readonly error?: Left<E>;
  readonly signIn: (option: SIO) => void;
}): SignedOutAuthState<E, SIO> {
  return {
    ...p,
    state: 'signedOut',
  };
}

/**
 *
 */
export type GetAuthState = () => Option<AuthState>;

/**
 *
 */
export type MakeDocState = (key: DocKey) => State<DocState>;
