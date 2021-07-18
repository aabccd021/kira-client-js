import { onDocChange } from '../cache';
import { readDoc } from '../service';
import {
  PGetNewDocId,
  PReadDoc,
  PSetDoc,
  DocState,
  Observable,
  OcToOcrDocField,
} from '../types';

export function makeDoc<S extends Schema, E>({
  collection,
  dbpGetNewDocId,
  dbpReadDoc,
  dbpSetDoc,
  ocToOcrDocField,
  id,
  schema,
}: {
  readonly collection: string;
  readonly dbpGetNewDocId: PGetNewDocId<E>;
  readonly dbpReadDoc: PReadDoc<E>;
  readonly dbpSetDoc: PSetDoc<E>;
  readonly ocToOcrDocField: OcToOcrDocField<S, E>;
  readonly id?: string;
  readonly schema: S;
}): Observable<DocState<E>> {
  return {
    initialState: id ? { state: 'initializing' } : { state: 'keyIsEmpty' },
    onChange: id
      ? (listener) => {
          readDoc({
            key: { collection, id },
            dbpReadDoc,
            dbpSetDoc,
            dbpGetNewDocId,
            ocToOcrDocField,
            schema,
          });
          const unsubscribe = onDocChange({ collection, id }, listener);
          return unsubscribe;
        }
      : undefined,
  };
}
