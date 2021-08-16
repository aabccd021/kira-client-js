import { None, optionFold } from 'trimop';

import { subscribeToDocState } from '../listenable/doc';
import { GetDocStateCtxIfAbsent, initializingDocState, MakeDocState } from '../type';

export function buildMakeDocState({
  initialFetchDoc,
}: {
  readonly initialFetchDoc: GetDocStateCtxIfAbsent;
}): MakeDocState {
  return (key) => ({
    effectOnInit: () => {
      initialFetchDoc(key);
      return None();
    },
    initialState: initializingDocState(),
    subscribe: (listen) =>
      subscribeToDocState(key, (docState) =>
        optionFold(
          docState,
          () => listen(initializingDocState()),
          (docState) => listen(docState)
        )
      ),
  });
}
