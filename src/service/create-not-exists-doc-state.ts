import { DocKey, Spec } from 'kira-core';
import { BuildDraft } from 'kira-nosql';
import { Some } from 'trimop';

import { DocToR, PSetDoc } from '..';
import { buildSetDocState } from '../listenable/doc';
import { _, doEffect, eMap, eMapLeft, eToRight, leftTo } from '../trimop/pipe';
import {
  CreateDocDocStateError,
  CreatingDocState,
  CToField,
  NotExistsDocState,
  PGetNewDocId,
  PReadDoc,
  ReadyDocState,
  RToDoc,
} from '../type';
import { buildCreateDoc } from './pure/create-doc';
import { buildCreateContainsErrorDocState } from './effect/create-contains-error-doc-state';

export type CreateNotExistsDocState = (key: DocKey) => NotExistsDocState;

export function buildCreateNotExistsDocState({
  buildDraft,
  cToField,
  docToR,
  pGetNewDocId,
  pSetDoc,
  rToDoc,
  pReadDoc,
  spec,
}: {
  readonly buildDraft: BuildDraft;
  readonly cToField: CToField;
  readonly docToR: DocToR;
  readonly pGetNewDocId: PGetNewDocId;
  readonly pReadDoc: PReadDoc;
  readonly pSetDoc: PSetDoc;
  readonly rToDoc: RToDoc;
  readonly spec: Spec;
}): CreateNotExistsDocState {
  const setDocState = buildSetDocState({ buildDraft, docToR, rToDoc, spec });
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
  const createDoc = buildCreateDoc({
    cToField,
    pGetNewDocId,
    pSetDoc,
    spec,
  });
  return (key) =>
    NotExistsDocState({
      create: (cDoc) => {
        setDocState(key)(CreatingDocState());
        createDoc({
          cDoc,
          col: key.col,
          id: Some(key.id),
        }).then((createResult) =>
          _(createResult)
            ._(eMap(({ doc, id }) => ({ data: docToR(doc), id })))
            ._(eMap(ReadyDocState))
            ._(eMapLeft(leftTo(CreateDocDocStateError)))
            ._(eToRight(createContainsErrorDocState(key)))
            ._(doEffect(setDocState(key)))
            .value()
        );
      },
    });
}
