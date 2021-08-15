import { DocKey, Spec } from 'kira-core';
import { BuildDraft } from 'kira-nosql';
import { Left } from 'trimop';

import { buildInitialFetchDoc } from '..';
import {
  ContainsErrorDocState,
  CToField,
  DocState,
  DocStateError,
  DocToR,
  PGetNewDocId,
  PReadDoc,
  PSetDoc,
  RToDoc,
} from '../type';

export type CreateContainsErrorDocState<DSE extends DocStateError = DocStateError> = (
  key: DocKey
) => (left: Left<DSE>) => DocState;

export function buildCreateContainsErrorDocState({
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
  readonly pReadDoc: PReadDoc;
  readonly pSetDoc: PSetDoc;
  readonly rToDoc: RToDoc;
  readonly spec: Spec;
}): CreateContainsErrorDocState {
  const initialFetchDoc = buildInitialFetchDoc({
    buildDraft,
    cToField,
    docToR,
    pGetNewDocId,
    pReadDoc,
    pSetDoc,
    rToDoc,
    spec,
  });
  return (key) => (error) =>
    ContainsErrorDocState({
      error,
      revalidate: () => initialFetchDoc(key),
    });
}
