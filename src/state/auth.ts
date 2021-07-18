import { DocKey } from 'kira-nosql';

import { getAuth, onAuthChange, onDocChange, setAuth } from '../cache';
import { createDoc, readDoc } from '../service';
import {
  AuthState,
  Observable,
  OcToDoc,
  PGetNewDocId,
  POnStateChanged,
  PReadDoc,
  PSetDoc,
  PSignIn,
  PSignOut,
  PUserCredToId,
  Unsubscribe,
  UserCredToDefaultDoc,
} from '../types';

export function makeAuth(): Observable<AuthState> {
  return {
    initialState: { state: 'initializing' },
    onChange: onAuthChange,
  };
}

export function initAuth<UC>({
  ocToDoc,
  userCol,
  userCredToDefaultDoc,
  userCredToId,
  provider,
}: {
  readonly userCol: string;
  readonly ocToDoc: OcToDoc;
  readonly provider: {
    readonly onAuthStateChanged: POnStateChanged<UC>;
    readonly signIn: PSignIn;
    readonly getNewDocId: PGetNewDocId;
    readonly setDoc: PSetDoc;
    readonly signOut: PSignOut;
    readonly readDoc: PReadDoc;
  };
  readonly userCredToDefaultDoc: UserCredToDefaultDoc<UC>;
  readonly userCredToId: PUserCredToId<UC>;
}): Unsubscribe {
  // eslint-disable-next-line functional/no-let
  let unsubscribeDocListener: Unsubscribe | undefined = undefined;

  const unsubscribeAuthListener = provider.onAuthStateChanged({
    signIn: async ({ userCred }) => {
      const id = userCredToId(userCred);
      setAuth({ state: 'loadingUserData', signOut: provider.signOut, id });

      const userDocKey: DocKey = { col: userCol, id };

      unsubscribeDocListener = onDocChange(userDocKey, (cachedUser) => {
        if (cachedUser.state === 'exists') {
          setAuth({
            state: 'signedIn',
            id,
            signOut: provider.signOut,
            user: cachedUser.data,
          });
          return;
        }

        if (cachedUser.state === 'notExists') {
          createDoc({
            colName: userCol,
            id,
            ocDoc: userCredToDefaultDoc(userCred),
            ocToDoc,
            provider,
          });
          return;
        }

        if (cachedUser.state === 'error') {
          setAuth({
            state: 'signedOut',
            error: cachedUser.error,
            signIn: provider.signIn,
          });
        }
      });
      readDoc({
        key: userDocKey,
        ocToDoc,
        provider: { ...provider },
      });
    },

    signOut: () => {
      unsubscribeDocListener?.();
      setAuth({ state: 'signedOut', signIn: provider.signIn });
    },

    error: ({ error }) => {
      const prevAuth = getAuth();
      if (prevAuth?.state === 'signedIn' || prevAuth?.state === 'signedOut') {
        setAuth({ ...prevAuth, error });
      }
    },
  });

  const unsubscribeAll: Unsubscribe = () => {
    unsubscribeDocListener?.();
    unsubscribeAuthListener();
  };

  return unsubscribeAll;
}
