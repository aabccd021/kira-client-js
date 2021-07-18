import { Dictionary, DocKey, ReadDocData } from 'kira-nosql';

import { OcField } from './data';
import { PQueryError, PReadDocError } from './provider';

// Utils
export type Reset = () => unknown;
export type OnReset = () => unknown;
export type Refresh = () => unknown;
export type OnCreated<T> = (t: T) => unknown;

// TODO: refresh (invalidate cache)
export type DocStateError = PReadDocError;
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
      readonly create: (ocDocData: Dictionary<OcField>) => void;
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
// export type CreateDocState<E, C extends string = string, T extends OCDocData = OCDocData> =
//   | {
//       readonly state: 'initializing';
//     }
//   | {
//       readonly state: 'userNotSignedIn';
//     }
//   | {
//       readonly state: 'notCreated';
//       readonly create: (t: T) => void;
//       readonly reset: Reset;
//       // TODO: isCreating: boolean;
//     }
//   | {
//       readonly state: 'creating';
//       readonly reset: Reset;
//     }
//   | {
//       readonly state: 'error';
//       readonly error: E;
//       readonly reset: Reset;
//     }
//   | {
//       readonly state: 'created';
//       readonly createdDocKey: DocKey<C>;
//       readonly reset: Reset;
//     };

// Auth
// export type SignOut = () => void;

// export type SignIn<SIO> = (sio: SIO) => void;

// export type SignedInAuthState<E, U extends DocData = DocData> = {
//   readonly state: 'signedIn';
//   readonly user: U;
//   readonly id: string;
//   readonly signOut: SignOut;
//   readonly error?: E;
// };

// export type LoadingUserDataAuthState = {
//   readonly state: 'loadingUserData';
//   readonly id: string;
//   readonly signOut: SignOut;
// };

// export type SignedOutAuthState<E, SIO> = {
//   readonly state: 'signedOut';
//   readonly signIn: (option: SIO) => void;
//   readonly error?: E;
// };

// export type AuthState<E, SIO, U extends DocData = DocData> =
//   | {
//       readonly state: 'initializing';
//     }
//   | SignedOutAuthState<E, SIO>
//   | LoadingUserDataAuthState
//   | SignedInAuthState<E, U>;

/**
 * Query
 * TODO: refresh
 */
export type QueryStateError = PQueryError;
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
