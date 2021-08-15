import { Spec } from "kira-core";
import { BuildDraft } from "kira-nosql";
import { Some } from "trimop";
import { NotExistsDocState, CToField, DocToR, PGetNewDocId, PReadDoc, PSetDoc, RToDoc, buildSetDocState, buildCreateDoc, CreatingDocState, ReadyDocState, CreateDocDocStateError, CreateNotExistsDocState } from "../..";
import { _, eMap, eMapLeft, leftTo, eToRight, doEffect } from "../../trimop/pipe";
import { buildCreateContainsErrorDocState } from "./create-contains-error-doc-state";


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
            .eval()
        );
      },
    });
}
