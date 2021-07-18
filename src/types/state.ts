import { DocKey, ReadDocData } from 'kira-nosql';

import { OcDoc } from './data';
import {
  CreateDocStateError,
  DocStateError,
  QueryStateError,
  SignedInAuthStateError,
  SignedOutAuthStateError,
} from './error';
import { SignInOption } from './provider';

// Utils
export type Reset = () => unknown;
export type OnReset = () => unknown;
export type Refresh = () => unknown;
export type OnCreated<T> = (t: T) => unknown;

// TODO: refresh (invalidate cache)
// Doc
export type DocState =
  | {
      readonly state: 'keyIsEmpty';
    }
  | {
      readonly state: 'initializing';
    }
  | {
      readonly state: 'error';
      readonly error: DocStateError;
      readonly refresh: Refresh;
    }
  | {
      readonly state: 'notExists';
      readonly create: (ocDocData: OcDoc) => void;
    }
  | {
      readonly state: 'creating';
      readonly refresh: Refresh;
    }
  | {
      readonly state: 'exists';
      readonly id: string;
      readonly data: ReadDocData;
    };

// Create Doc
export type CreateDocState =
  | {
      readonly state: 'initializing';
    }
  | {
      readonly state: 'userNotSignedIn';
    }
  | {
      readonly state: 'notCreated';
      readonly create: (ocDoc: OcDoc) => void;
      readonly reset: Reset;
      // TODO: isCreating: boolean;
    }
  | {
      readonly state: 'creating';
      readonly reset: Reset;
    }
  | {
      readonly state: 'error';
      readonly error: CreateDocStateError;
      readonly reset: Reset;
    }
  | {
      readonly state: 'created';
      readonly createdDocKey: DocKey;
      readonly reset: Reset;
    };

// Auth
export type SignOut = () => void;

export type SignIn<SIO> = (sio: SIO) => void;

export type SignedInAuthState = {
  readonly state: 'signedIn';
  readonly user: ReadDocData;
  readonly id: string;
  readonly signOut: SignOut;
  readonly error?: SignedInAuthStateError;
};

export type LoadingUserDataAuthState = {
  readonly state: 'loadingUserData';
  readonly id: string;
  readonly signOut: SignOut;
};

export type SignedOutAuthState = {
  readonly state: 'signedOut';
  readonly signIn: (option: SignInOption) => void;
  readonly error?: SignedOutAuthStateError;
};

export type AuthState =
  | { readonly state: 'initializing' }
  | SignedOutAuthState
  | LoadingUserDataAuthState
  | SignedInAuthState;

/**
 * Query
 * TODO: refresh
 */
export type QueryState =
  | {
      readonly state: 'initializing';
    }
  | {
      readonly state: 'error';
      readonly error: QueryStateError;
    }
  | LoadedQueryState;
export type LoadedQueryState =
  | {
      readonly state: 'loaded';
      readonly keys: readonly DocKey[];
      readonly hasMore: true;
      readonly fetchNext: () => void;
      readonly isFetching: boolean;
    }
  | {
      readonly state: 'loaded';
      readonly keys: readonly DocKey[];
      readonly hasMore: false;
    };
