import { DocSnapshot, Spec } from 'kira-core';
import { Either } from 'trimop';

import { docSnapshot } from '../../core';
import {
  _,
  deCompact,
  dEntry,
  dFromEntry,
  dLookup,
  dMapEntries,
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
  cToFieldCtx,
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
            ._(oMap(teRight))
            ._(oGetOrElse(() => pGetNewDocId(col)))
            ._(teMapLeft(pGetNewDocIdCreateDocErr))
            ._(
              teChain((id) =>
                _(colSpec)
                  ._(
                    dMapEntries((fieldSpec, fieldName) =>
                      _(cDoc)
                        ._(dLookup(fieldName))
                        ._(cToFieldCtx({ col, fieldName, id }))
                        ._(cToField(fieldSpec))
                        ._(tMap(dEntry(fieldName)))
                        ._val()
                    )
                  )
                  ._(tParallel)
                  ._(tMap(dFromEntry))
                  ._(tMap(deCompact))
                  ._(teMapLeft(cToFieldCreateDocErr))
                  ._(teMap(doCompact))
                  ._(teMap(docSnapshot(id)))
                  ._val()
              )
            )
            ._val()
        )
      )
      ._(
        oGetOrElse<Task<Either<CreateDocErr, DocSnapshot>>>(() =>
          _(col)._(unknownColCreateDocErr)._(teLeft)._val()
        )
      )
      ._(
        teChain((snapshot) =>
          _(
            pSetDoc({
              doc: snapshot.doc,
              key: { col, id: snapshot.id },
            })
          )
            ._(teMapLeft(pSetDocCreateDocErr))
            ._(teMap(() => snapshot))
            ._val()
        )
      )
      ._val();
}
