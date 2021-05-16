import { getAuth, makeSubject, onAuthChange, subjectToObservable } from '../cache';
import { createDoc } from '../service';
import {
  CreateDocState,
  DbpGetNewDocId,
  DbpSetDoc,
  Dictionary,
  DocKey,
  Field,
  Observable,
  OnCreated,
  OnReset,
  SpUploadFile,
} from '../types';

/**
 * @param ownerless - Set this to true if document has no `owner` field.
 * Setting to true allows document to be created without signed in.
 * The default value is false since most of the time creating document
 * requires user to be signed up.
 * For example, this should be set to true when creating new user.
 */
export function makeCreateDoc<DBE, SE>({
  colName,
  schema,
  dbpSetDoc,
  dbpGetNewDocId,
  spUploadFile,
  ownerless,
  onReset,
  onCreated,
}: {
  colName: string;
  schema: {
    cols: Dictionary<Dictionary<Field>>;
  };
  dbpSetDoc: DbpSetDoc<DBE>;
  dbpGetNewDocId: DbpGetNewDocId<DBE>;
  spUploadFile: SpUploadFile<SE>;
  ownerless?: true;
  onReset?: OnReset;
  onCreated?: OnCreated<DocKey>;
}): Observable<CreateDocState<DBE, SE>> {
  const createDocState = makeSubject<CreateDocState<DBE, SE>>({ state: 'initializing' });

  const reset: () => void = () => {
    const auth = getAuth();

    //if owner is required but not signed in
    if (!ownerless && auth?.state !== 'signedIn') {
      createDocState.set({ state: 'userNotSignedIn' });
      return;
    }

    onReset?.();
    createDocState.set({
      state: 'notCreated',
      reset,
      create: async (docData) => {
        createDocState.set({ state: 'creating', reset });
        const createdDocKey = await createDoc({
          colName,
          ocDocData: docData,
          schema,
          dbpSetDoc,
          dbpGetNewDocId,
          spUploadFile,
        });
        if (createdDocKey._tag === 'left') {
          createDocState.set({ state: 'error', reset, error: createdDocKey.error });
        } else {
          createDocState.set({ state: 'created', reset, createdDocKey: createdDocKey.value });
          onCreated?.(createdDocKey.value);
        }
      },
    });
  };

  return subjectToObservable(createDocState, {
    onInit() {
      reset;
      const unsubscribe = onAuthChange(reset);
      return unsubscribe;
    },
  });
}
