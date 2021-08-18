import { CountFieldSpec, NumberField } from 'kira-core';
import { Either, Left, None, Some } from 'trimop';

import { _, oeGetOrLeft, oeGetOrRight, O.map, Task, toRightSome } from '../trimop/function';
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
    ._(O.map(() => Left(invalidTypeCToFieldErr({ col, field, fieldName }))))
    ._(oeGetOrRight(() => None()))
    ._(Task)
    ._v();
}

export function rToCountField({
  ctx: { fieldName, field, col },
}: {
  readonly ctx: RToFieldCtx;
  readonly fieldSpec: CountFieldSpec;
}): Either<RToDocErr, Some<NumberField>> {
  return _(field)
    ._(
      O.map((field) =>
        typeof field === 'number'
          ? _(NumberField(field))._(toRightSome)._v()
          : _(invalidTypeRToDocErr({ col, field, fieldName }))._(Left)._v()
      )
    )
    ._(oeGetOrLeft(() => invalidTypeRToDocErr({ col, field, fieldName })))
    ._v();
}
