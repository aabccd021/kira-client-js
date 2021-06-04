import { Schema_1, Schema_3 } from 'kira-core';

import { getAuth, onDocChange, setAuth } from '../cache';
import {
  ApOnStateChanged,
  ApSignIn,
  ApSignOut,
  ApUserCredToId,
  DbpGetNewDocId,
  DbpReadDoc,
  DbpSetDoc,
  DocKey,
  OcToOcrDocField,
  Unsubscribe,
  UserCredToDefaultDoc,
} from '../types';
import { createDoc, readDoc } from './crud';

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
      setAuth({ state: 'loadingUserData', signOut, id });

      const userDocKey: DocKey = { collection: schema.userCol, id };

      unsubscribeDocListener = onDocChange(userDocKey, (cachedUser) => {
        if (cachedUser.state === 'exists') {
          setAuth({
            state: 'signedIn',
            id: id,
            signOut,
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
            schema,
            ocToOcrDocField,
          });
          return;
        }

        if (cachedUser.state === 'error') {
          setAuth({
            state: 'signedOut',
            signIn,
            error: { type: 'db', error: cachedUser.error },
          });
        }
      });
      readDoc({
        key: userDocKey,
        dbpReadDoc,
        dbpSetDoc,
        dbpGetNewDocId,
        schema,
        ocToOcrDocField,
      });
    },

    signOut: () => {
      unsubscribeDocListener?.();
      setAuth({ state: 'signedOut', signIn });
    },

    error: ({ error }) => {
      const prevAuth = getAuth();
      if (prevAuth?.state === 'signedIn' || prevAuth?.state === 'signedOut') {
        setAuth({
          ...prevAuth,
          error: { type: 'auth', error },
        });
      }
    },
  });

  const unsubscribeAll: Unsubscribe = () => {
    unsubscribeDocListener?.();
    unsubscribeAuthListener();
  };

  return unsubscribeAll;
}
