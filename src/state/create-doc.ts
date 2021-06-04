import { Schema } from 'kira-core';

import { getAuth, makeSubject, onAuthChange, subjectToObservable } from '../cache';
import { createDoc } from '../service';
import {
  AuthError,
  CreateDocState,
  DbpGetNewDocId,
  DbpSetDoc,
  DocKey,
  Observable,
  OcToOcrDocField,
  OnCreated,
  OnReset,
} from '../types';

// export function makeCreateDoc_3<E>({
//   colName,
//   schema,
//   dbpSetDoc,
//   dbpGetNewDocId,
//   ownerless,
//   onReset,
//   onCreated,
// }: {
//   readonly colName: string;
//   readonly schema: Schema_3;
//   readonly dbpSetDoc: DbpSetDoc<E>;
//   readonly dbpGetNewDocId: DbpGetNewDocId<E>;
//   readonly ownerless?: true;
//   readonly onReset?: OnReset;
//   readonly onCreated?: OnCreated<DocKey>;
// }): Observable<CreateDocState<E>> {
// }

/**
 * @param ownerless - Set this to true if document has no `owner` field.
 * Setting to true allows document to be created without signed in.
 * The default value is false since most of the time creating document
 * requires user to be signed up.
 * For example, this should be set to true when creating new user.
 */
export function makeCreateDoc<S extends Schema, E>({
  colName,
  dbpGetNewDocId,
  dbpSetDoc,
  ocToOcrDocField,
  onCreated,
  onReset,
  ownerless,
  schema,
}: {
  readonly colName: string;
  readonly dbpGetNewDocId: DbpGetNewDocId<E>;
  readonly dbpSetDoc: DbpSetDoc<E>;
  readonly ocToOcrDocField: OcToOcrDocField<S, E>;
  readonly onCreated?: OnCreated<DocKey>;
  readonly onReset?: OnReset;
  readonly ownerless?: true;
  readonly schema: S;
}): Observable<CreateDocState<E | AuthError>> {
  const createDocState = makeSubject<CreateDocState<E | AuthError>>({ state: 'initializing' });

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
          dbpSetDoc,
          dbpGetNewDocId,
          ocToOcrDocField,
          schema,
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
