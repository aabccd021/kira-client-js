import { None, optionFold } from 'trimop';

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
    subscribe: (listen) =>
      subscribeToDocState(key, (docState) =>
        optionFold(
          docState,
          () => {
            console.log('sini');
            listen(InitializingDocState());
          },
          (docState) => {
            console.log('situ', { docState });
            listen(docState);
          }
        )
      ),
  });
}
