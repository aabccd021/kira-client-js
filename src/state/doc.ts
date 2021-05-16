import { onDocChange } from '../cache';
import { readDoc } from '../service';
import {
  DbpGetNewDocId,
  DbpReadDoc,
  DbpSetDoc,
  Dictionary,
  DocState,
  Field,
  Observable,
  SpUploadFile,
} from '../types';

export function makeDoc<DBE, SE>({
  collection,
  id,
  schema,
  dbpReadDoc,
  dbpSetDoc,
  dbpGetNewDocId,
  spUploadFile,
}: {
  readonly collection: string;
  readonly id?: string;
  readonly schema: {
    readonly cols: Dictionary<Dictionary<Field>>;
  };
  readonly dbpReadDoc: DbpReadDoc<DBE>;
  readonly dbpSetDoc: DbpSetDoc<DBE>;
  readonly dbpGetNewDocId: DbpGetNewDocId<DBE>;
  readonly spUploadFile: SpUploadFile<SE>;
}): Observable<DocState<DBE>> {
  return {
    initialState: id ? { state: 'initializing' } : { state: 'keyIsEmpty' },
    onChange: id
      ? (listener) => {
          readDoc({
            key: { collection, id },
            schema,
            dbpReadDoc,
            dbpSetDoc,
            dbpGetNewDocId,
            spUploadFile,
          });
          const unsubscribe = onDocChange({ collection, id }, listener);
          return unsubscribe;
        }
      : undefined,
  };
}
