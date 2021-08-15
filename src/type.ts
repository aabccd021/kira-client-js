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
export type InvalidKeyError = {
  readonly key: string;
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
export type QueryKey = {
  readonly limit?: number;
  readonly orderByField?: string;
  readonly orderDirection?: 'asc' | 'desc';
};

/**
 *
 */
export type PQuery<E extends PQueryError, DBC = unknown> = (param: {
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
export type PUploadImage<E extends PUploadImageError> = (args: {
  readonly col: string;
  readonly fieldName: string;
  readonly file: File;
  readonly id: string;
}) => Task<Either<E, PUploadImageResult>>;

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
export type RField = string | number | Date | ImageRField | RefRField;

/**
 *
 */
export type RDoc = Dict<RField>;

/**
 *
 */
export type RToDocError = { readonly _errorType: 'RToDocError' };

/**
 *
 */
export type InvalidTypeRToDocError = {
  readonly _errorType: 'RToDocError';
  readonly _errorType2: 'InvalidTypeRToDocError';
  readonly col: string;
  readonly field: unknown;
  readonly fieldName: string;
  readonly message?: string;
};

export function InvalidTypeRToDocError(
  p: Omit<InvalidTypeRToDocError, '_errorType2' | '_errorType'>
): InvalidTypeRToDocError {
  return {
    ...p,
    _errorType: 'RToDocError',
    _errorType2: 'InvalidTypeRToDocError',
  };
}

/**
 *
 */
export type RToFieldNeverError = {
  readonly _errorType: 'RToDocError';
  readonly _errorType2: 'NeverError';
  readonly never: never;
};

export function RToFieldNeverError(never: never): RToFieldNeverError {
  return {
    _errorType: 'RToDocError',
    _errorType2: 'NeverError',
    never,
  };
}

/**
 *
 */
export function RToDocUnknownCollectionNameError(
  value: Omit<RToDocUnknownCollectionNameError, '_errorType' | '_errorType2'>
): RToDocUnknownCollectionNameError {
  return {
    _errorType: 'RToDocError',
    _errorType2: 'UnknownCollectionNameError',
    ...value,
  };
}

export type RToDocUnknownCollectionNameError = {
  readonly _errorType: 'RToDocError';
  readonly _errorType2: 'UnknownCollectionNameError';
  readonly col: string;
};

/**
 *
 */
export function RToDocUnknownFieldNameError(
  value: Omit<RToDocUnknownFieldNameError, '_errorType' | '_errorType2'>
): RToDocUnknownFieldNameError {
  return {
    _errorType: 'RToDocError',
    _errorType2: 'UnknownFieldNameError',
    ...value,
  };
}

export type RToDocUnknownFieldNameError = {
  readonly _errorType: 'RToDocError';
  readonly _errorType2: 'UnknownFieldNameError';
  readonly fieldName: string;
};

/**
 *
 */
export type RToFieldContext = {
  readonly col: string;
  readonly field: Option<RField>;
  readonly fieldName: string;
};

/**
 *
 */
export type RToField<E extends RToDocError = RToDocError> = (param: {
  readonly context: RToFieldContext;
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
export type CToFieldUploadImageError<PUIE extends PUploadImageError> = {
  readonly _errorType: 'CToFieldError';
  readonly _errorType2: 'UploadImageError';
  readonly uploadImageError: PUIE;
};

export function CToFieldUploadImageError<PUIE extends PUploadImageError>(
  providerError: PUIE
): CToFieldUploadImageError<PUIE> {
  return {
    _errorType: 'CToFieldError',
    _errorType2: 'UploadImageError',
    uploadImageError: providerError,
  };
}

/**
 *
 */
export type CToFieldUserNotSignedInError = {
  readonly _errorType: 'CToFieldError';
  readonly _errorType2: 'UserNotSignedInError';
  readonly signInRequired: string;
};

export function CToFieldUserNotSignedInError(
  p: Omit<CToFieldUserNotSignedInError, '_errorType' | '_errorType2'>
): CToFieldUserNotSignedInError {
  return {
    ...p,
    _errorType: 'CToFieldError',
    _errorType2: 'UserNotSignedInError',
  };
}

/**
 *
 */
export type CToFieldRToDocError = {
  readonly _errorType: 'CToFieldError';
  readonly _errorType2: 'RToDocError';
  readonly rToDocError: RToDocError;
};

export function CToFieldRToDocError(rToDocError: RToDocError): CToFieldRToDocError {
  return {
    _errorType: 'CToFieldError',
    _errorType2: 'RToDocError',
    rToDocError,
  };
}

/**
 *
 */
export type CToFieldNeverError = {
  readonly _errorType: 'CToFieldError';
  readonly _errorType2: 'NeverError';
  readonly never: never;
};

export function CToFieldNeverError(never: never): CToFieldNeverError {
  return {
    _errorType: 'CToFieldError',
    _errorType2: 'NeverError',
    never,
  };
}

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
export type CToField<E extends CToFieldError = CToFieldError> = (param: {
  readonly context: CToFieldContext;
  readonly fieldSpec: FieldSpec;
}) => Task<Either<E, Option<Field>>>;

/**
 * InvalidCreationFieldTypeError
 */
export type InvalidTypeCToFieldError = {
  readonly _errorType: 'CToFieldError';
  readonly _errorType2: 'InvalidTypeCToFieldError';
  readonly col: string;
  readonly field: unknown;
  readonly fieldName: string;
  readonly message?: string;
};

export function InvalidTypeCToFieldError(
  p: Omit<InvalidTypeCToFieldError, '_errorType2' | '_errorType'>
): InvalidTypeCToFieldError {
  return {
    ...p,
    _errorType: 'CToFieldError',
    _errorType2: 'InvalidTypeCToFieldError',
  };
}

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
 * UnknownCollectionNameError
 */
export function UnknownCollectionNameError(
  value: Omit<UnknownCollectionNameError, '_errorType'>
): UnknownCollectionNameError {
  return { _errorType: 'UnknownCollectionNameError', ...value };
}

export type UnknownCollectionNameError = {
  readonly _errorType: 'UnknownCollectionNameError';
  readonly col: string;
};

/**
 *
 */
export type CreateDocError<
  CFTE extends CToFieldError = CToFieldError,
  PGNDI extends PGetNewDocIdError = PGetNewDocIdError,
  PSDE extends PSetDocError = PSetDocError
> = UnknownCollectionNameError | CFTE | PGNDI | PSDE;

/**
 *
 */
export type CreateDocResult = {
  readonly doc: Doc;
  readonly id: string;
};

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
}) => Task<Either<CreateDocError<CFTE, PGNDI, PSDE>, CreateDocResult>>;

/**
 *
 */
export type DocStateError = { readonly _errorType: 'DocStateError' };

/**
 *
 */
export type CreateDocDocStateError<CDE extends CreateDocError> = {
  readonly _errorType: 'DocStateError';
  readonly _errorType2: 'CreateDoc';
  readonly createDocError: CDE;
};

export function CreateDocDocStateError<CDE extends CreateDocError>(
  createDocError: CDE
): CreateDocDocStateError<CDE> {
  return {
    _errorType: 'DocStateError',
    _errorType2: 'CreateDoc',
    createDocError,
  };
}

/**
 *
 */
export type PReadDocDocStateError<PRDE extends PReadDocError> = {
  readonly _errorType: 'DocStateError';
  readonly _errorType2: 'PReadDoc';
  readonly readDocError: PRDE;
};

export function PReadDocDocStateError<PRDE extends PReadDocError>(
  readDocError: PRDE
): PReadDocDocStateError<PRDE> {
  return {
    _errorType: 'DocStateError',
    _errorType2: 'PReadDoc',
    readDocError,
  };
}

// /**
//  *
//  */
// export type CToFieldDocStateError<CTFE extends CToFieldError> = {
//   readonly _errorType: 'DocStateError';
//   readonly _errorType2: 'CToField';
//   readonly cToFieldError: CTFE;
// };

// export function CToFieldDocStateError<CTFE extends CToFieldError>(
//   p: Omit<CToFieldDocStateError<CTFE>, '_errorType2' | '_errorType'>
// ): CToFieldDocStateError<CTFE> {
//   return {
//     ...p,
//     _errorType: 'DocStateError',
//     _errorType2: 'CToField',
//   };
// }

/**
 *
 */
export type ContainsErrorDocState<E extends DocStateError> = {
  readonly error: Left<E>;
  readonly revalidate: () => void;
  readonly state: 'ContainsError';
};

export function ContainsErrorDocState<E extends DocStateError>(
  p: Omit<ContainsErrorDocState<E>, 'state'>
): ContainsErrorDocState<E> {
  return { ...p, state: 'ContainsError' };
}

/**
 *
 */
export type NotExistsDocState<C extends CDoc = CDoc> = {
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

export function CreatingDocState(): CreatingDocState {
  return { state: 'Creating' };
}

/**
 *
 */
export type ReadyDocState<R extends RDoc = RDoc> = {
  readonly data: R;
  readonly id: string;
  // readonly revalidate: () => void;
  readonly state: 'Ready';
};

export function ReadyDocState<R extends RDoc>(
  p: Omit<ReadyDocState<R>, 'state'>
): ReadyDocState<R> {
  return { ...p, state: 'Ready' };
}

/**
 *
 */
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
export type InitialFetchDoc = (key: DocKey) => void;

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
 */
export type InitializingAuthState = {
  readonly state: 'initializing';
};

export function InitializingAuthState(): InitializingAuthState {
  return { state: 'initializing' };
}

/**
 * SignedIn
 */
export type SignedInAuthState<E extends AuthStateError, URD extends RDoc> = {
  readonly error?: Left<E>;
  readonly signOut: () => void;
  readonly state: 'signedIn';
  readonly user: URD;
  readonly userId: string;
};

export function SignedInAuthState<E extends AuthStateError, URD extends RDoc>(
  p: Omit<SignedInAuthState<E, URD>, 'state'>
): SignedInAuthState<E, URD> {
  return { ...p, state: 'signedIn' };
}

/**
 *
 */
export type LoadingUserDataAuthState = {
  readonly signOut: () => void;
  readonly state: 'loadingUserData';
  readonly userId: string;
};

export function LoadingUserDataAuthState(
  p: Omit<LoadingUserDataAuthState, 'state'>
): LoadingUserDataAuthState {
  return { ...p, state: 'loadingUserData' };
}

/**
 *
 */
export type SignedOutAuthState<E extends AuthStateError, SIO> = {
  readonly error?: Left<E>;
  readonly signIn: (option: SIO) => void;
  readonly state: 'signedOut';
};

export function SignedOutAuthState<E extends AuthStateError, SIO>(
  p: Omit<SignedOutAuthState<E, SIO>, 'state'>
): SignedOutAuthState<E, SIO> {
  return {
    ...p,
    state: 'signedOut',
  };
}

/**
 *
 */
export type AuthState<
  ASE extends AuthStateError = AuthStateError,
  SIO = unknown,
  URD extends RDoc = RDoc
> =
  | InitializingAuthState
  | SignedOutAuthState<ASE, SIO>
  | LoadingUserDataAuthState
  | SignedInAuthState<ASE, URD>;

/**
 *
 */
export type GetAuthState = () => Option<AuthState>;

/**
 *
 */
export type MakeDocState = (key: DocKey) => State<DocState>;

/**
 *
 */
export type CreateNotExistsDocState = (key: DocKey) => NotExistsDocState;

/**
 *
 */
export type CreateContainsErrorDocState<DSE extends DocStateError = DocStateError> = (
  key: DocKey
) => (left: Left<DSE>) => DocState;
