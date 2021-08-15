import { Spec } from 'kira-core';
import { BuildDraft } from 'kira-nosql';

import { buildSetDocState, getDocState } from '../listenable/doc';
import {
  _,
  doTaskEffect,
  eMap,
  eMapLeft,
  eToRight,
  leftTo,
  oMap,
  oToSome,
  tMap,
  toTask,
} from '../trimop/pipe';
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
} from '../type';
import { buildCreateContainsErrorDocState } from './set-contains-error-doc-state';
import { buildCreateNotExistsDocState } from './set-not-exists-doc-state';

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
  const setDocState = buildSetDocState({ buildDraft, docToR, rToDoc, spec });
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

  return (key) =>
    _(key)
      ._(getDocState)
      ._(oMap(toTask))
      ._(
        oToSome(
          _(key)
            ._(pReadDoc)
            ._(
              tMap((res) =>
                _(res)
                  ._(
                    eMap((remoteDoc) =>
                      remoteDoc.state === 'exists'
                        ? ReadyDocState({ data: docToR(remoteDoc.data), id: key.id })
                        : createNotExistsDocState(key)
                    )
                  )
                  ._(eMapLeft(leftTo(PReadDocDocStateError)))
                  ._(eToRight(createContainsErrorDocState(key)))
                  .eval()
              )
            ).eval
        )
      )
      ._(doTaskEffect((docState) => setDocState(key, docState)))
      .eval();
}
