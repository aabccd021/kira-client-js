import { Spec } from 'kira-core';
import { BuildDraft } from 'kira-nosql';

import {
  CToField,
  DocToR,
  InitialFetchDoc,
  PGetNewDocId,
  PReadDoc,
  PReadDocDocStateError,
  PReadDocError,
  PSetDoc,
  ReadyDocState,
  RToDoc,
} from '../..';
import { _, oGetOrElse, oMap, Task, teGetOrElse, teMap, teMapLeft } from '../../trimop/pipe';
// eslint-disable-next-line import/no-cycle
import { buildCreateContainsErrorDocState } from '../effect/create-contains-error-doc-state';
// eslint-disable-next-line import/no-cycle
import { buildCreateNotExistsDocState } from '../effect/create-not-exists-doc-state';

export function buildInitialFetchDoc<PRDE extends PReadDocError>({
  buildDraft,
  cToField,
  docToR,
  pGetNewDocId,
  pReadDoc,
  pSetDoc,
  rToDoc,
  spec,
}: {
  readonly buildDraft: BuildDraft;
  readonly cToField: CToField;
  readonly docToR: DocToR;
  readonly pGetNewDocId: PGetNewDocId;
  readonly pReadDoc: PReadDoc<PRDE>;
  readonly pSetDoc: PSetDoc;
  readonly rToDoc: RToDoc;
  readonly spec: Spec;
}): InitialFetchDoc {
  const createNotExistsDocState = buildCreateNotExistsDocState({
    buildDraft,
    cToField,
    docToR,
    pGetNewDocId,
    pReadDoc,
    pSetDoc,
    rToDoc,
    spec,
  });

  const createContainsErrorDocState = buildCreateContainsErrorDocState({
    buildDraft,
    cToField,
    docToR,
    pGetNewDocId,
    pReadDoc,
    pSetDoc,
    rToDoc,
    spec,
  });

  return (key, docState) =>
    _(docState)
      ._(oMap(Task))
      ._(
        oGetOrElse(() =>
          _(key)
            ._(pReadDoc)
            ._(
              teMap((remoteDoc) =>
                remoteDoc.state === 'exists'
                  ? _(remoteDoc.data)
                      ._(docToR)
                      ._((data) => ReadyDocState({ data, id: key.id }))
                      ._val()
                  : createNotExistsDocState(key)
              )
            )
            ._(teMapLeft(PReadDocDocStateError))
            ._(teGetOrElse(createContainsErrorDocState(key)))
            ._val()
        )
      )
      ._val();
}
