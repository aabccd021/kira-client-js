import { Spec } from 'kira-core';
import { BuildDraft } from 'kira-nosql';

import {
  ContainsErrorDocState,
  CreateContainsErrorDocState,
  CToField,
  DocToR,
  PGetNewDocId,
  PReadDoc,
  PSetDoc,
  RToDoc,
} from '../../type';
// eslint-disable-next-line import/no-cycle
import { buildInitialFetchDoc } from './initial-fetch-doc';

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
