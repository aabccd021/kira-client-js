// import { Spec } from 'kira-core';
// import { BuildDraft } from 'kira-nosql';

// import { buildSetDocState, getDocState } from '../../listenable/doc';
// import { _, bind, bind2, tDo, tMap } from '../../trimop/pipe';
// import {
//   ContainsErrDocState,
//   CreateContainsErrDocState,
//   CToField,
//   DocToR,
//   PGetNewDocId,
//   PReadDoc,
//   PSetDoc,
//   RToDoc,
// } from '../../type';
// // eslint-disable-next-line import/no-cycle
// import { buildInitialFetchDoc } from '../pure/initial-fetch-doc';

// export function buildCreateContainsErrDocState({
//   buildDraft,
//   cToField,
//   docToR,
//   pGetNewDocId,
//   pReadDoc,
//   pSetDoc,
//   rToDoc,
//   spec,
// }: {
//   readonly buildDraft: BuildDraft;
//   readonly cToField: CToField;
//   readonly docToR: DocToR;
//   readonly pGetNewDocId: PGetNewDocId;
//   readonly pReadDoc: PReadDoc;
//   readonly pSetDoc: PSetDoc;
//   readonly rToDoc: RToDoc;
//   readonly spec: Spec;
// }): CreateContainsErrDocState {
//   const initialFetchDoc = buildInitialFetchDoc({
//     buildDraft,
//     cToField,
//     docToR,
//     pGetNewDocId,
//     pReadDoc,
//     pSetDoc,
//     rToDoc,
//     spec,
//   });

//   const setDocState = buildSetDocState({ buildDraft, docToR, rToDoc, spec });
//   return (key) => (error) =>
//     ContainsErrDocState({
//       error,
//       revalidate: () => {
//         _(key)
//           ._(bind(getDocState))
//           ._(bind2(initialFetchDoc))
//           ._(([key, __, newDocState]) =>
//             _(newDocState)
//               ._(tMap(setDocState(key)))
//               ._(tDo)
//               ._val()
//           )
//           ._val();
//       },
//     });
// }
