import { Schema_1, Schema_3 } from 'kira-core';

import { getAuth, onAuthChange, onDocChange, setAuth } from '../cache';
import { createDoc, readDoc } from '../service';
import {
  ApOnStateChanged,
  ApSignIn,
  ApSignOut,
  ApUserCredToId,
  AuthState,
  DbpGetNewDocId,
  DbpReadDoc,
  DbpSetDoc,
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

export function initAuth<S extends Schema_1 | Schema_3, E, SIO, UC>({
  dbpGetNewDocId,
  dbpReadDoc,
  dbpSetDoc,
  ocToOcrDocField,
  onAuthStateChanged,
  schema,
  signIn,
  signOut,
  userCredToDefaultDoc,
  userCredToId,
}: {
  readonly dbpGetNewDocId: DbpGetNewDocId<E>;
  readonly dbpReadDoc: DbpReadDoc<E>;
  readonly dbpSetDoc: DbpSetDoc<E>;
  readonly ocToOcrDocField: OcToOcrDocField<S, E>;
  readonly onAuthStateChanged: ApOnStateChanged<E, UC>;
  readonly schema: S;
  readonly signIn: ApSignIn<SIO>;
  readonly signOut: ApSignOut;
  readonly userCredToDefaultDoc: UserCredToDefaultDoc<UC>;
  readonly userCredToId: ApUserCredToId<UC>;
}): Unsubscribe {
  // eslint-disable-next-line functional/no-let
  let unsubscribeDocListener: Unsubscribe | undefined = undefined;

  const unsubscribeAuthListener = onAuthStateChanged({
    signIn: async ({ userCred }) => {
      const id = userCredToId(userCred);
      setAuth<E, SIO>({ state: 'loadingUserData', signOut, id });

      const userDocKey: DocKey = { collection: schema.userCol, id };

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
          createDoc({
            colName: userDocKey.collection,
            dbpGetNewDocId,
            dbpSetDoc,
            id,
            ocDocData: userCredToDefaultDoc(userCred),
            ocToOcrDocField,
            schema,
          });
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
      readDoc({
        dbpGetNewDocId,
        dbpReadDoc,
        dbpSetDoc,
        key: userDocKey,
        ocToOcrDocField,
        schema,
      });
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
