import { None } from 'trimop';

import { subscribeToDocState } from '../listenable/doc';
import { InitialFetchDoc, InitializingDocState, MakeDocState } from '../type';

export function buildMakeDocState({
  initialFetchDoc,
}: {
  readonly initialFetchDoc: InitialFetchDoc;
}): MakeDocState {
  return (key) => ({
    effectOnInit: () => {
      console.log('aabccd');
      initialFetchDoc(key);
      return None();
    },
    initialState: InitializingDocState(),
    subscribe: (listen) => subscribeToDocState(key, listen),
  });
}
