import { Schema_1 } from 'kira-core';

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
  SpUploadFile,
  Unsubscribe,
  UserCredToDefaultDoc,
} from '../types';
import { createDoc_1, readDoc } from './crud';

// export function initAuth_3<AE, DBE, SE, SIO, UC>({
//   onAuthStateChanged,
//   signIn,
//   signOut,
//   userCredToDefaultDoc,
//   userCredToId,
//   schema,
//   dbpSetDoc,
//   dbpReadDoc,
//   dbpGetNewDocId,
// }: {
//   readonly schema: Schema_3;
//   readonly onAuthStateChanged: ApOnStateChanged<AE, UC>;
//   readonly signIn: ApSignIn<SIO>;
//   readonly signOut: ApSignOut;
//   readonly userCredToDefaultDoc: UserCredToDefaultDoc<UC>;
//   readonly userCredToId: ApUserCredToId<UC>;
//   readonly dbpSetDoc: DbpSetDoc<DBE>;
//   readonly dbpReadDoc: DbpReadDoc<DBE>;
//   readonly dbpGetNewDocId: DbpGetNewDocId<DBE>;
// }): Unsubscribe {
// }

export function initAuth<AE, DBE, SE, SIO, UC>({
  onAuthStateChanged,
  signIn,
  signOut,
  userCredToDefaultDoc,
  userCredToId,
  schema,
  dbpSetDoc,
  dbpReadDoc,
  dbpGetNewDocId,
  spUploadFile,
}: {
  readonly schema: Schema_1;
  readonly onAuthStateChanged: ApOnStateChanged<AE, UC>;
  readonly signIn: ApSignIn<SIO>;
  readonly signOut: ApSignOut;
  readonly userCredToDefaultDoc: UserCredToDefaultDoc<UC>;
  readonly userCredToId: ApUserCredToId<UC>;
  readonly dbpSetDoc: DbpSetDoc<DBE>;
  readonly dbpReadDoc: DbpReadDoc<DBE>;
  readonly dbpGetNewDocId: DbpGetNewDocId<DBE>;
  readonly spUploadFile: SpUploadFile<SE>;
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
          createDoc_1({
            colName: userDocKey.collection,
            id,
            ocDocData: userCredToDefaultDoc(userCred),
            schema,
            dbpSetDoc,
            dbpGetNewDocId,
            spUploadFile,
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
        schema,
        dbpSetDoc,
        dbpGetNewDocId,
        spUploadFile,
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
