import { Spec } from "kira-core";
import { BuildDraft } from "kira-nosql";
import { PReadDocError, CToField, DocToR, PGetNewDocId, PReadDoc, PSetDoc, RToDoc, InitialFetchDoc, buildSetDocState, getDocState, ReadyDocState, PReadDocDocStateError } from "../..";
import { _, oMap, Task,  eMap, eMapLeft, leftTo, eToRight, doTaskEffect, tToPromise, oToSome, tMap } from "../../trimop/pipe";
import { buildCreateContainsErrorDocState } from "./create-contains-error-doc-state";
import { buildCreateNotExistsDocState } from "./create-not-exists-doc-state";

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
                  ._(eToRight(createContainsErrorDocState(key))).value()
              )
            ).value()
        )
      )
      ._(doTaskEffect(setDocState(key)))
      ._(tToPromise)
      .value();
}
