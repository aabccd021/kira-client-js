import { DocKey } from 'kira-nosql';

import { getAuth, makeSubject, onAuthChange, subjectToObservable } from '../cache';
import { createDoc } from '../service';
import {
  CreateDocState,
  Observable,
  OcToDoc,
  OnCreated,
  OnReset,
  PGetNewDocId,
  PSetDoc,
} from '../types';

/**
 * @param ownerless - Set this to true if document has no `owner` field.
 * Setting to true allows document to be created without signed in.
 * The default value is false since most of the time creating document
 * requires user to be signed up.
 * For example, this should be set to true when creating new user.
 */
export function makeCreateDoc({
  colName,
  provider,
  onCreated,
  onReset,
  ownerless,
  ocToDoc,
}: {
  readonly colName: string;
  readonly provider: {
    readonly getNewDocId: PGetNewDocId;
    readonly setDoc: PSetDoc;
  };
  readonly onCreated?: OnCreated<DocKey>;
  readonly onReset?: OnReset;
  readonly ownerless?: true;
  readonly ocToDoc: OcToDoc;
}): Observable<CreateDocState> {
  const createDocState = makeSubject<CreateDocState>({ state: 'initializing' });

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
      create: async (ocDoc) => {
        createDocState.set({ state: 'creating', reset });
        const createdDocKey = await createDoc({
          colName,
          ocDoc,
          provider,
          ocToDoc,
        });
        if (createdDocKey.tag === 'left') {
          createDocState.set({
            state: 'error',
            reset,
            error: createdDocKey.error,
          });
        } else {
          createDocState.set({
            state: 'created',
            reset,
            createdDocKey: createdDocKey.value,
          });
          onCreated?.(createdDocKey.value);
        }
      },
    });
  };

  return subjectToObservable(createDocState, {
    onInit() {
      // TODO: maybe invoke reset(), or not needed?
      reset;
      return onAuthChange(reset);
    },
  });
}
