import { DocSnapshot, Spec } from 'kira-core';
import { Either } from 'trimop';

import {
  _,
  deCompact,
  DEntry,
  dFromEntry,
  dLookup,
  dMap,
  doCompact,
  oGetOrElse,
  oMap,
  Task,
  teChain,
  teLeft,
  teMap,
  teMapLeft,
  teRight,
  tMap,
  tParallel,
} from '../../trimop/pipe';
import {
  CreateDoc,
  CreateDocErr,
  CToField,
  cToFieldCreateDocErr,
  PGetNewDocId,
  pGetNewDocIdCreateDocErr,
  PSetDoc,
  pSetDocCreateDocErr,
  unknownColCreateDocErr,
} from '../../type';

export function buildCreateDoc({
  cToField,
  spec,
  pGetNewDocId,
  pSetDoc,
}: {
  readonly cToField: CToField;
  readonly pGetNewDocId: PGetNewDocId;
  readonly pSetDoc: PSetDoc;
  readonly spec: Spec;
}): CreateDoc {
  return ({ cDoc, col, id: givenId }) =>
    _(spec)
      ._(dLookup(col))
      ._(
        oMap((colSpec) =>
          _(givenId)
            ._(oMap((t) => _(t)._(teRight)._val()))
            ._(oGetOrElse(() => _({ col })._(pGetNewDocId)._val()))
            ._(teMapLeft(pGetNewDocIdCreateDocErr))
            ._(
              teChain((id) =>
                _(colSpec)
                  ._(
                    dMap((fieldSpec, fieldName) =>
                      _(cDoc)
                        ._(dLookup(fieldName))
                        ._((field) => ({ col, field, fieldName, id }))
                        ._((ctx) => cToField({ ctx, fieldSpec }))
                        ._(tMap((field) => DEntry(fieldName, field)))
                        ._val()
                    )
                  )
                  ._(tParallel)
                  ._(tMap(dFromEntry))
                  ._(tMap(deCompact))
                  ._(teMapLeft(cToFieldCreateDocErr))
                  ._(teMap(doCompact))
                  ._(teMap((doc) => ({ doc, id })))
                  ._val()
              )
            )
            ._val()
        )
      )
      ._(
        oGetOrElse<Task<Either<CreateDocErr, DocSnapshot>>>(() =>
          _(unknownColCreateDocErr({ col }))._(teLeft)._val()
        )
      )
      ._(
        teChain((snapshot) =>
          _(
            pSetDoc({
              doc: snapshot.doc,
              key: { col, id: snapshot.id },
              spec,
            })
          )
            ._(teMapLeft(pSetDocCreateDocErr))
            ._(teMap(() => snapshot))
            ._val()
        )
      )
      ._val();
}
