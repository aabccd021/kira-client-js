import { Doc, DocKey, DocSnapshot, Field, FieldSpec } from 'kira-core';
import { Dict, Either, Left, Option } from 'trimop';

import { Task } from './trimop/type';

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
export type PSignOutErr = { readonly _errorType: 'PSignOutErr' };

/**
 *
 */
export type PSignOut<E extends PSignOutErr> = () => Either<E, Task<void>>;

/**
 *
 */
export type PSignInErr = { readonly _errorType: 'PSignInErr' };

/**
 *
 */
export type PSignIn<E extends PSignInErr, SIO = unknown, UC = unknown> = (
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
export type PReadDocErr = { readonly _errorType: 'PReadDocErr' };

/**
 *
 */
export type PReadDoc<E extends PReadDocErr = PReadDocErr> = (
  key: DocKey
) => Task<Either<E, PReadDocResult>>;

/**
 *
 */
export type PGetNewDocIdErr = { readonly _errorType: 'PGetNewDocIdErr' };

/**
 *
 */
export type PGetNewDocId<E extends PGetNewDocIdErr = PGetNewDocIdErr> = (
  col: string
) => Task<Either<E, string>>;

/**
 *
 */
export type PSetDocErr = { readonly _errorType: 'PSetDocErr' };

/**
 *
 */
export type PSetDoc<E extends PSetDocErr = PSetDocErr, R = unknown> = (
  key: DocKey
) => (doc: Doc) => Task<Either<E, R>>;

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
export type PQueryErr = { readonly _errorType: 'PQueryErr' };

/**
 *
 */
export type PQuery<E extends PQueryErr = PQueryErr, DBC = unknown> = (param: {
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
export type PUploadImageErr = { readonly _errorType: 'PUploadImageErr' };

/**
 *
 */
export type PUploadImage<E extends PUploadImageErr = PUploadImageErr> = (args: {
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
 * RToDocErr
 *
 */
export type InvalidTypeRToDocErr = {
  readonly _errorType: 'InvalidTypeErr';
  readonly col: string;
  readonly field: unknown;
  readonly fieldName: string;
  readonly message?: string;
};

export type UnknownColRToDocErr = {
  readonly _errorType: 'UnknownColErr';
  readonly col: string;
};

export type NeverRToDocErr = {
  readonly _errorType: 'NeverErr';
  readonly never: unknown;
};

export type RToDocErr = InvalidTypeRToDocErr | NeverRToDocErr | UnknownColRToDocErr;

export function invalidTypeRToDocErr(p: {
  readonly col: string;
  readonly field: unknown;
  readonly fieldName: string;
  readonly message?: string;
}): RToDocErr {
  return {
    ...p,
    _errorType: 'InvalidTypeErr',
  };
}

export function neverRToFieldErr(never: unknown): RToDocErr {
  return {
    _errorType: 'NeverErr',
    never,
  };
}

export function unknownColRToDocErr(col: string): RToDocErr {
  return {
    _errorType: 'UnknownColErr',
    col,
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

export function rToFieldCtx({
  col,
  fieldName,
}: {
  readonly col: string;
  readonly fieldName: string;
}): (field: Option<RField>) => RToFieldCtx {
  return (field) => ({ col, field, fieldName });
}

/**
 *
 */
export type RToField = (
  fieldSpec: FieldSpec
) => (ctx: RToFieldCtx) => Either<RToDocErr, Option<Field>>;

/**
 *
 */
export type RToDoc = (col: string) => (rDoc: RDoc) => Either<RToDocErr, Doc>;

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
 * CToFieldErr
 *
 */
export type UploadImageCToFieldErr<PUIE extends PUploadImageErr> = {
  readonly _errorType: 'UploadImageErr';
  readonly uploadImageErr: PUIE;
};

export type UserNotSignedInCToFieldErr = {
  readonly _errorType: 'UserNotSignedInErr';
  readonly signInRequired: string;
};

export type RToDocCToFieldErr = {
  readonly _errorType: 'RToDocErr';
  readonly rToDocErr: RToDocErr;
};

export type NeverCToFieldErr = {
  readonly _errorType: 'NeverErr';
  readonly never: never;
};

export type InvalidTypeCToFieldErr = {
  readonly _errorType: 'InvalidTypeCToFieldErr';
  readonly col: string;
  readonly field: unknown;
  readonly fieldName: string;
  readonly message?: string;
};

export type CToFieldErr<PUIE extends PUploadImageErr = PUploadImageErr> =
  | UploadImageCToFieldErr<PUIE>
  | UserNotSignedInCToFieldErr
  | RToDocCToFieldErr
  | NeverCToFieldErr
  | InvalidTypeCToFieldErr;

export function uploadImageCToFieldErr<PUIE extends PUploadImageErr>(
  uploadImageErr: PUIE
): CToFieldErr<PUIE> {
  return {
    _errorType: 'UploadImageErr',
    uploadImageErr,
  };
}

export function userNotSignedInCToFieldErr(signInRequired: string): CToFieldErr {
  return {
    _errorType: 'UserNotSignedInErr',
    signInRequired,
  };
}

export function rToDocCToFieldErr(rToDocErr: RToDocErr): CToFieldErr {
  return {
    _errorType: 'RToDocErr',
    rToDocErr,
  };
}

export function neverCToFieldErr(never: never): CToFieldErr {
  return {
    _errorType: 'NeverErr',
    never,
  };
}

export function invalidTypeCToFieldErr(p: {
  readonly col: string;
  readonly field: unknown;
  readonly fieldName: string;
  readonly message?: string;
}): CToFieldErr {
  return {
    ...p,
    _errorType: 'InvalidTypeCToFieldErr',
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

export function cToFieldCtx(p: {
  readonly col: string;
  readonly fieldName: string;
  readonly id: string;
}): (field: Option<CField>) => CToFieldCtx {
  return (field) => ({ ...p, field });
}

/**
 *
 */
export type CToField = (
  fieldSpec: FieldSpec
) => (ctx: CToFieldCtx) => Task<Either<CToFieldErr, Option<Field>>>;

/**
 *
 * CreateDocErr
 *
 */
export type PSetDocCreateDocErr<PSDE extends PSetDocErr> = {
  readonly _errorType: 'PSetDocErr';
  readonly error: PSDE;
};

export type UnknownColCreateDocErr = {
  readonly _errorType: 'UnknownColErr';
  readonly col: string;
};

export type CToFieldCreateDocErr<CTFE extends CToFieldErr> = {
  readonly _errorType: 'CToFieldErr';
  readonly err: CTFE;
};

export type PGetNewDocIdCreateDocErr<PGNIE extends PGetNewDocIdErr> = {
  readonly _errorType: 'PGetNewDocIdErr';
  readonly err: PGNIE;
};

export type CreateDocErr<
  PSDE extends PSetDocErr = PSetDocErr,
  CTFE extends CToFieldErr = CToFieldErr,
  PGNIE extends PGetNewDocIdErr = PGetNewDocIdErr
> = { readonly _errorType: string } & (
  | PSetDocCreateDocErr<PSDE>
  | UnknownColCreateDocErr
  | CToFieldCreateDocErr<CTFE>
  | PGetNewDocIdCreateDocErr<PGNIE>
);

export function cToFieldCreateDocErr<CTFE extends CToFieldErr>(err: CTFE): CreateDocErr {
  return { _errorType: 'CToFieldErr', err };
}

export function pGetNewDocIdCreateDocErr<PGNIE extends PGetNewDocIdErr>(err: PGNIE): CreateDocErr {
  return { _errorType: 'PGetNewDocIdErr', err };
}

export function unknownColCreateDocErr(col: string): CreateDocErr {
  return { _errorType: 'UnknownColErr', col };
}

export function pSetDocCreateDocErr<PSDE extends PSetDocErr>(error: PSDE): CreateDocErr {
  return { _errorType: 'PSetDocErr', error };
}

/**
 *
 */
export type CreateDoc = (p: {
  readonly cDoc: CDoc;
  readonly col: string;
  readonly id: Option<string>;
}) => Task<Either<CreateDocErr, DocSnapshot>>;

/**
 *
 * DocStateErr
 *
 */
export type CreateDocDocStateErr<CDE extends CreateDocErr> = {
  readonly _errorType: 'CreateDocErr';
  readonly createDocErr: CDE;
};

export type PReadDocDocStateErr<PRDE extends PReadDocErr> = {
  readonly _errorType: 'PReadDocErr';
  readonly readDocErr: PRDE;
};

export type DocStateErr<
  PRDE extends PReadDocErr = PReadDocErr,
  CDE extends CreateDocErr = CreateDocErr
> = {
  readonly _errorType: string;
} & (CreateDocDocStateErr<CDE> | PReadDocDocStateErr<PRDE>);

export function createDocDocStateErr<CDE extends CreateDocErr>(createDocErr: CDE): DocStateErr {
  return { _errorType: 'CreateDocErr', createDocErr };
}

export function pReadDocDocStateErr<PRDE extends PReadDocErr>(readDocErr: PRDE): DocStateErr {
  return { _errorType: 'PReadDocErr', readDocErr };
}

/**
 *
 * DocState
 *
 */
export type ContainsErrDocState<E extends DocStateErr> = {
  readonly error: Left<E>;
  readonly revalidate: () => void;
  readonly state: 'ContainsErr';
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
  E extends DocStateErr = DocStateErr,
  R extends RDoc = RDoc,
  C extends CDoc = CDoc
> = {
  readonly state: string;
} & (
  | ContainsErrDocState<E>
  | CreatingDocState
  | InitializingDocState
  | KeyIsEmptyDocState
  | NotExistsDocState<C>
  | ReadyDocState<R>
);

export function containsErrDocState<E extends DocStateErr>(p: {
  readonly error: Left<E>;
  readonly revalidate: () => void;
}): DocState {
  return { ...p, state: 'ContainsErr' };
}

export function creatingDocState(): DocState {
  return { state: 'Creating' };
}

export function initializingDocState(): DocState {
  return { state: 'Initializing' };
}

export function keyIsEmptyDocState(): DocState {
  return { state: 'KeyIsEmpty' };
}

export function notExistsDocState(create: (ocDocData: CDoc) => void): DocState {
  return { create, state: 'NotExists' };
}

export function readyDocState<R extends RDoc>(id: string): (data: R) => ReadyDocState<R> {
  return (data) => ({ data, id, state: 'Ready' });
}

/**
 *
 * DocStateCtx
 *
 */
export type ContainsErrDocStateCtx<E extends DocStateErr> = {
  readonly error: Left<E>;
  readonly key: DocKey;
  readonly state: 'ContainsErr';
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

export type DocStateCtx<E extends DocStateErr = DocStateErr, R extends RDoc = RDoc> = {
  readonly state: string;
} & (
  | ContainsErrDocStateCtx<E>
  | CreatingDocStateCtx
  | InitializingDocStateCtx
  | KeyIsEmptyDocStateCtx
  | NotExistsDocStateCtx
  | ReadyDocStateCtx<R>
);

export function containsErrDocStateCtx<E extends DocStateErr>(
  key: DocKey
): (error: Left<E>) => DocStateCtx {
  return (error) => ({ error, key, state: 'ContainsErr' });
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

export function readyDocStateCtx<R extends RDoc>(id: string): (data: R) => DocStateCtx {
  return (data) => ({ data, id, state: 'Ready' });
}

/**
 *
 */
export type SetDocState<
  E extends DocStateErr = DocStateErr,
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
export type AuthStateErr = { readonly _errorType: 'AuthStateErr' };

/**
 *
 * Auth State
 *
 */
export type InitializingAuthState = {
  readonly state: 'initializing';
};

export type SignedInAuthState<E extends AuthStateErr, URD extends RDoc> = {
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

export type SignedOutAuthState<E extends AuthStateErr, SIO> = {
  readonly error?: Left<E>;
  readonly signIn: (option: SIO) => void;
  readonly state: 'signedOut';
};

export type AuthState<
  ASE extends AuthStateErr = AuthStateErr,
  SIO = unknown,
  URD extends RDoc = RDoc
> =
  | InitializingAuthState
  | SignedOutAuthState<ASE, SIO>
  | LoadingUserDataAuthState
  | SignedInAuthState<ASE, URD>;

export function InitializingAuthState(): AuthState {
  return { state: 'initializing' };
}

export function signedInAuthState<E extends AuthStateErr, URD extends RDoc>(p: {
  readonly error?: Left<E>;
  readonly signOut: () => void;
  readonly user: URD;
  readonly userId: string;
}): AuthState<E, URD> {
  return { ...p, state: 'signedIn' };
}

export function loadingUserDataAuthState(p: {
  readonly signOut: () => void;
  readonly userId: string;
}): AuthState {
  return { ...p, state: 'loadingUserData' };
}

export function signedOutAuthState<E extends AuthStateErr, SIO>(p: {
  readonly error?: Left<E>;
  readonly signIn: (option: SIO) => void;
}): AuthState<E, SIO> {
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
