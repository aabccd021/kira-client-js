import { onDocChange } from '../cache';
import { readDoc } from '../service';
import { DocState, Observable, OcToField, PGetNewDocId, PReadDoc, PSetDoc } from '../types';

export function makeDoc({
  col,
  provider,
  ocToField,
  id,
}: {
  readonly col: string;
  readonly id?: string;
  readonly provider: {
    readonly getNewDocId: PGetNewDocId;
    readonly readDoc: PReadDoc;
    readonly setDoc: PSetDoc;
  };
  readonly ocToField: OcToField;
}): Observable<DocState> {
  return {
    initialState: id ? { state: 'initializing' } : { state: 'keyIsEmpty' },
    onChange: id
      ? (listener) => {
          const key = { col, id };
          readDoc({ key, ocToField, provider });
          return onDocChange(key, listener);
        }
      : undefined,
  };
}
