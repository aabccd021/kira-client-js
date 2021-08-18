import { Spec } from 'kira-core';

import { docSnapshot } from '../../core';
import * as D from '../../trimop/dict';
import * as DE from '../../trimop/dict-either';
import * as DO from '../../trimop/dict-option';
import { _ } from '../../trimop/function';
import * as O from '../../trimop/option';
import * as OTE from '../../trimop/option-task-either';
import * as T from '../../trimop/task';
import * as TE from '../../trimop/task-either';
import {
  CreateDoc,
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
      ._(D.lookup(col))
      ._(
        O.map((colSpec) =>
          _(givenId)
            ._(O.map(TE.right))
            ._(O.getOrElse(() => pGetNewDocId(col)))
            ._(TE.mapLeft(pGetNewDocIdCreateDocErr))
            ._(
              TE.chain((id) =>
                _(colSpec)
                  ._(
                    D.mapEntries((fieldSpec, fieldName) =>
                      _(cDoc)
                        ._(D.lookup(fieldName))
                        ._(cToFieldCtx({ col, fieldName, id }))
                        ._(cToField(fieldSpec))
                        ._(T.map(D.entry(fieldName)))
                        ._v()
                    )
                  )
                  ._(T.parallel)
                  ._(T.map(D.fromEntry))
                  ._(T.map(DE.compact))
                  ._(TE.mapLeft(cToFieldCreateDocErr))
                  ._(TE.map(DO.compact))
                  ._(TE.map(docSnapshot(id)))
                  ._v()
              )
            )

            ._v()
        )
      )
      ._(OTE.getOrLeft(() => unknownColCreateDocErr(col)))
      ._(
        TE.chainFirst((snapshot) =>
          _(snapshot.doc)
            ._(pSetDoc({ col, id: snapshot.id }))
            ._(TE.mapLeft(pSetDocCreateDocErr))
            ._v()
        )
      )
      ._v();
}
