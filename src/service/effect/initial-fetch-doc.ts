import { Spec } from 'kira-core';
import { BuildDraft } from 'kira-nosql';

import {
  buildSetDocState,
  CToField,
  DocToR,
  getDocState,
  InitialFetchDoc,
  PGetNewDocId,
  PReadDoc,
  PReadDocDocStateError,
  PReadDocError,
  PSetDoc,
  ReadyDocState,
  RToDoc,
} from '../..';
import {
  _,
  doTaskEffect,
  oMap,
  oToSome,
  Task,
  teMap,
  teMapLeft,
  teToRight,
  tToPromise,
} from '../../trimop/pipe';
// eslint-disable-next-line import/no-cycle
import { buildCreateContainsErrorDocState } from './create-contains-error-doc-state';
// eslint-disable-next-line import/no-cycle
import { buildCreateNotExistsDocState } from './create-not-exists-doc-state';

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
      ._(oMap(Task))
      ._(
        oToSome(() =>
          _(key)
            ._(pReadDoc)
            ._(
              teMap((remoteDoc) =>
                remoteDoc.state === 'exists'
                  ? _(remoteDoc.data)
                      ._(docToR)
                      ._((data) => ReadyDocState({ data, id: key.id }))
                      .value()
                  : createNotExistsDocState(key)
              )
            )
            ._(teMapLeft(PReadDocDocStateError))
            ._(teToRight(createContainsErrorDocState(key)))
            .value()
        )
      )
      ._(doTaskEffect(setDocState(key)))
      ._(tToPromise)
      .value();
}
