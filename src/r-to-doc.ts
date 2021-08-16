import { Spec } from 'kira-core';

import {
  _,
  deCompact,
  dFilter,
  dLookup,
  dMapValues,
  doCompact,
  eMap,
  oeGetOrLeft,
  oMap,
} from './trimop/pipe';
import { RToDoc, RToField, rToFieldCtx, unknownColRToDocErr } from './type';

export function buildRToDoc(spec: Spec, rToField: RToField): RToDoc {
  return (col) => (rDoc) =>
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
      ._(oeGetOrLeft(() => unknownColRToDocErr(col)))
      ._val();
}
