import { Doc, DocData, DocKey, OCDocData } from './data';

// Errors
export type AuthError<AE, DBE> =
  | {
      readonly type: 'auth';
      readonly error?: AE;
    }
  | {
      readonly type: 'db';
      readonly error?: DBE;
    };

export type CreateDocError<DBE, SE> =
  | {
      readonly type: 'db';
      readonly error: DBE;
    }
  | {
      readonly type: 'storage';
      readonly error: SE;
    }
  | {
      readonly type: 'userNotSignedIn';
    };

// Utils
export type Reset = () => unknown;
export type OnReset = () => unknown;
export type Refresh = () => unknown;
export type OnCreated<T> = (t: T) => unknown;

// TODO: refresh (invalidate cache)
// Doc
export type DocState<
  DBE,
  C extends string = string,
  T extends DocData = DocData,
  TC extends OCDocData = OCDocData
> =
  | {
      readonly state: 'keyIsEmpty';
    }
  | {
      readonly state: 'initializing';
    }
  | {
      readonly state: 'error';
      readonly error: DBE;
      readonly refresh: Refresh;
    }
  | {
      readonly state: 'notExists';
      readonly create: (ocDocData: TC) => void;
    }
  | {
      readonly state: 'creating';
      readonly refresh: Refresh;
    }
  | {
      readonly state: 'exists';
      readonly doc: Doc<C, T>;
    };

// Create Doc
export type CreateDocState<DBE, SE, C extends string = string, T extends OCDocData = OCDocData> =
  | {
      readonly state: 'initializing';
    }
  | {
      readonly state: 'userNotSignedIn';
    }
  | {
      readonly state: 'notCreated';
      readonly create: (t: T) => void;
      readonly reset: Reset;
      // TODO: isCreating: boolean;
    }
  | {
      readonly state: 'creating';
      readonly reset: Reset;
    }
  | {
      readonly state: 'error';
      readonly error: CreateDocError<DBE, SE>;
      readonly reset: Reset;
    }
  | {
      readonly state: 'created';
      readonly createdDocKey: DocKey<C>;
      readonly reset: Reset;
    };

// Auth
export type SignOut = () => void;

export type SignIn<SIO> = (sio: SIO) => void;

export type SignedInAuthState<AE, DBE, U extends DocData = DocData> = {
  readonly state: 'signedIn';
  readonly user: U;
  readonly id: string;
  readonly signOut: SignOut;
  readonly error?: AuthError<AE, DBE>;
};

export type LoadingUserDataAuthState = {
  readonly state: 'loadingUserData';
  readonly id: string;
  readonly signOut: SignOut;
};

export type SignedOutAuthState<AE, DBE, SIO> = {
  readonly state: 'signedOut';
  readonly signIn: (option: SIO) => void;
  readonly error?: AuthError<AE, DBE>;
};

export type AuthState<AE, DBE, SIO, U extends DocData = DocData> =
  | {
      readonly state: 'initializing';
    }
  | SignedOutAuthState<AE, DBE, SIO>
  | LoadingUserDataAuthState
  | SignedInAuthState<AE, DBE, U>;

// Query
// TODO: refresh
export type QueryState<DBE, C extends string = string> =
  | {
      readonly state: 'initializing';
    }
  | {
      readonly state: 'error';
      readonly error: DBE;
    }
  | {
      readonly state: 'loaded';
      readonly keys: ReadonlyArray<DocKey<C>>;
      readonly hasMore: true;
      readonly fetchNext: () => void;
      readonly isFetching: boolean;
    }
  | {
      readonly state: 'loaded';
      readonly keys: ReadonlyArray<DocKey<C>>;
      readonly hasMore: false;
    };
