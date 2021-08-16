import { Doc, Spec } from 'kira-core';
import { Either, Left } from 'trimop';

import {
  _,
  deCompact,
  dFilter,
  dLookup,
  dMapValues,
  doCompact,
  eMap,
  oGetOrElse,
  oMap,
} from './trimop/pipe';
import { RToDoc, RToDocErr, RToField, rToFieldCtx, unknownColRToDocErr } from './type';

export function buildRToDoc(spec: Spec, rToField: RToField): RToDoc {
  return (col, rDoc) =>
    _(spec)
      ._(dLookup(col))
      ._(
        oMap((colSpec) =>
          _(colSpec)
            ._(dFilter((_, fieldName) => fieldName[0] !== '_'))
            ._(
              dMapValues((fieldSpec, fieldName) =>
                _(rDoc)
                  ._(dLookup(fieldName))
                  ._(rToFieldCtx({ col, fieldName }))
                  ._(rToField(fieldSpec))
                  ._val()
              )
            )
            ._(deCompact)
            ._(eMap(doCompact))
            ._val()
        )
      )
      ._(oGetOrElse<Either<RToDocErr, Doc>>(() => _(col)._(unknownColRToDocErr)._(Left)._val()))
      ._val();
}
