import { None } from 'trimop';

import { subscribeToDocState } from '../listenable/doc';
import { DocState, InitialFetchDoc, InitializingDocState, State } from '../type';

export function makeDocState(
  col: string,
  id: string,
  initialFetchDoc: InitialFetchDoc
): State<DocState> {
  const key = { col, id };
  return {
    effectOnInit: () => {
      initialFetchDoc(key);
      return None();
    },
    initialState: InitializingDocState(),
    subscribe: (listen) => subscribeToDocState(key, listen),
  };
}
