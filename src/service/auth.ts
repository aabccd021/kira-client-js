import { getAuth, onDocChange, setAuth } from '../cache';
import {
  ApOnStateChanged,
  ApSignOut,
  ApUserCredToId,
  DbpGetNewDocId,
  DbpReadDoc,
  DbpSetDoc,
  Dictionary,
  DocKey,
  Field,
  SignIn,
  SpUploadFile,
  Unsubscribe,
  UserCredToDefaultDoc,
} from '../types';
import { createDoc, readDoc } from './crud';

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
  readonly onAuthStateChanged: ApOnStateChanged<AE, UC>;
  readonly signIn: SignIn<SIO>;
  readonly signOut: ApSignOut;
  readonly userCredToDefaultDoc: UserCredToDefaultDoc<UC>;
  readonly userCredToId: ApUserCredToId<UC>;
  readonly schema: {
    readonly userCol: string;
    readonly cols: Dictionary<Dictionary<Field>>;
  };
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
          createDoc({
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
