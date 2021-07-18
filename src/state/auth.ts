import { getAuth, onAuthChange, onDocChange, setAuth } from '../cache';
import {
  ApOnStateChanged,
  ApSignIn,
  ApSignOut,
  ApUserCredToId,
  AuthState,
  PGetNewDocId,
  PReadDoc,
  PSetDoc,
  DocKey,
  Observable,
  OcToOcrDocField,
  Unsubscribe,
  UserCredToDefaultDoc,
} from '../types';

export function makeAuth<E, SIO>(): Observable<AuthState<E, SIO>> {
  return {
    initialState: { state: 'initializing' },
    onChange: onAuthChange,
  };
}

export function initAuth<E, SIO, UC>({
  dbpGetNewDocId,
  dbpReadDoc,
  dbpSetDoc,
  ocToOcrDocField,
  onAuthStateChanged,
  signIn,
  signOut,
  userCol,
  userCredToDefaultDoc,
  userCredToId,
}: {
  readonly dbpGetNewDocId: PGetNewDocId<E>;
  readonly dbpReadDoc: PReadDoc<E>;
  readonly dbpSetDoc: PSetDoc<E>;
  readonly ocToOcrDocField: OcToOcrDocField<S, E>;
  readonly onAuthStateChanged: ApOnStateChanged<E, UC>;
  readonly signIn: ApSignIn<SIO>;
  readonly signOut: ApSignOut;
  readonly userCol: string;
  readonly userCredToDefaultDoc: UserCredToDefaultDoc<UC>;
  readonly userCredToId: ApUserCredToId<UC>;
}): Unsubscribe {
  // eslint-disable-next-line functional/no-let
  let unsubscribeDocListener: Unsubscribe | undefined = undefined;

  const unsubscribeAuthListener = onAuthStateChanged({
    signIn: async ({ userCred }) => {
      const id = userCredToId(userCred);
      setAuth<E, SIO>({ state: 'loadingUserData', signOut, id });

      const userDocKey: DocKey = { collection: userCol, id };

      unsubscribeDocListener = onDocChange<E>(userDocKey, (cachedUser) => {
        if (cachedUser.state === 'exists') {
          setAuth<E, SIO>({
            id,
            signOut,
            state: 'signedIn',
            user: cachedUser.doc,
          });
          return;
        }

        if (cachedUser.state === 'notExists') {
          // createDoc({
          //   colName: userDocKey.collection,
          //   dbpGetNewDocId,
          //   dbpSetDoc,
          //   id,
          //   ocDocData: userCredToDefaultDoc(userCred),
          //   ocToOcrDocField,
          //   schema,
          // });
          return;
        }

        if (cachedUser.state === 'error') {
          setAuth<E, SIO>({
            error: cachedUser.error,
            signIn,
            state: 'signedOut',
          });
        }
      });
      // readDoc({
      //   dbpGetNewDocId,
      //   dbpReadDoc,
      //   dbpSetDoc,
      //   key: userDocKey,
      //   ocToOcrDocField,
      //   schema,
      // });
    },

    signOut: () => {
      unsubscribeDocListener?.();
      setAuth<E, SIO>({ state: 'signedOut', signIn });
    },

    error: ({ error }) => {
      const prevAuth = getAuth();
      if (prevAuth?.state === 'signedIn' || prevAuth?.state === 'signedOut') {
        setAuth<E, SIO>({ ...prevAuth, error });
      }
    },
  });

  const unsubscribeAll: Unsubscribe = () => {
    unsubscribeDocListener?.();
    unsubscribeAuthListener();
  };

  return unsubscribeAll;
}
