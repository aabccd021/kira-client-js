import { CountFieldSpec, NumberField } from 'kira-core';
import { Either, Left, None, Some } from 'trimop';

import { _, oeGetOrLeft, oeGetOrRight, oMap, Task, toRightSome } from '../trimop/pipe';
import {
  CToFieldCtx,
  CToFieldErr,
  invalidTypeCToFieldErr,
  invalidTypeRToDocErr,
  RToDocErr,
  RToFieldCtx,
} from '../type';

export function cToCountField({
  ctx: { field, fieldName, col },
}: {
  readonly ctx: CToFieldCtx;
  readonly fieldSpec: CountFieldSpec;
}): Task<Either<CToFieldErr, None>> {
  return _(field)
    ._(oMap(() => Left(invalidTypeCToFieldErr({ col, field, fieldName }))))
    ._(oeGetOrRight(() => None()))
    ._(Task)
    ._val();
}

export function rToCountField({
  ctx: { fieldName, field, col },
}: {
  readonly ctx: RToFieldCtx;
  readonly fieldSpec: CountFieldSpec;
}): Either<RToDocErr, Some<NumberField>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'number'
          ? _(NumberField(field))._(toRightSome)._val()
          : _(invalidTypeRToDocErr({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(oeGetOrLeft(() => invalidTypeRToDocErr({ col, field, fieldName })))
    ._val();
}
