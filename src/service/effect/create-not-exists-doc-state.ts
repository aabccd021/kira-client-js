import { Spec } from 'kira-core';
import { BuildDraft } from 'kira-nosql';
import { Some } from 'trimop';

import {
  buildCreateDoc,
  buildSetDocState,
  CreateDocDocStateError,
  CreateNotExistsDocState,
  CreatingDocState,
  CToField,
  DocToR,
  NotExistsDocState,
  PGetNewDocId,
  PReadDoc,
  PSetDoc,
  ReadyDocState,
  RToDoc,
} from '../..';
import { _, doEffect, tDo, teGetOrElse, teMap, teMapLeft, tMap } from '../../trimop/pipe';
// eslint-disable-next-line import/no-cycle
import { buildCreateContainsErrorDocState } from './create-contains-error-doc-state';

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
        _(CreatingDocState())
          ._(doEffect(setDocState(key)))
          ._(() =>
            createDoc({
              cDoc,
              col: key.col,
              id: Some(key.id),
            })
          )
          ._(teMap(({ doc, id }) => ({ data: docToR(doc), id })))
          ._(teMap(ReadyDocState))
          ._(teMapLeft(CreateDocDocStateError))
          ._(teGetOrElse(createContainsErrorDocState(key)))
          ._(tMap(setDocState(key)))
          ._(tDo)
          ._val();
      },
    });
}
