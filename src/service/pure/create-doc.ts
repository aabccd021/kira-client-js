import { DocSnapshot, Spec } from 'kira-core';
import { Either, Option } from 'trimop';

import {
  _,
  deCompact,
  DEntry,
  dFromEntry,
  dLookup,
  dMap,
  doCompact,
  oMap,
  oToSome,
  Task,
  teFlatten,
  teMap,
  teMapLeft,
  tMap,
  toTaskLeft,
  toTaskRight,
  tParallel,
} from '../../trimop/pipe';
import {
  CreateDoc,
  CreateDocError,
  CToField,
  CToFieldCreateDocError,
  PGetNewDocId,
  PGetNewDocIdCreateDocError,
  PSetDoc,
  PSetDocCreateDocError,
  UnknownColCreateDocError,
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
            ._(oMap((t) => _(t)._(toTaskRight)._val()))
            ._(oToSome(() => _({ col })._(pGetNewDocId)._val()))
            ._(
              teMap((id) =>
                _(colSpec)
                  ._(
                    dMap((fieldSpec, fieldName) =>
                      _(cDoc)
                        ._(dLookup(fieldName))
                        ._((field) => ({ col, field, fieldName, id }))
                        ._((context) => cToField({ context, fieldSpec }))
                        ._(tMap((field) => DEntry(fieldName, field)))
                        ._val()
                    )
                  )
                  ._(tParallel)
                  ._(tMap(dFromEntry))
                  ._(tMap(deCompact))
                  ._(teMap(doCompact))
                  ._(teMap((doc) => ({ doc, id })))
                  ._<Task<Either<CreateDocError, DocSnapshot>>>(teMapLeft(CToFieldCreateDocError))
                  ._val()
              )
            )
            ._(teMapLeft(PGetNewDocIdCreateDocError))
            ._(teFlatten)
            ._val()
        )
      )
      ._(
        oToSome<Task<Either<CreateDocError, DocSnapshot>>>(() =>
          _(UnknownColCreateDocError({ col }))._(toTaskLeft)._val()
        )
      )
      ._(
        teMap((snapshot) =>
          _(
            pSetDoc({
              doc: snapshot.doc,
              key: { col, id: snapshot.id },
              spec,
            })
          )
            ._(teMap(() => snapshot))
            ._(teMapLeft(PSetDocCreateDocError))
            ._val()
        )
      )
      ._(teFlatten)
      ._val();
}
