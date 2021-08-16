import { CreationTimeFieldSpec, DateField } from 'kira-core';
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

export function cToCreationTimeField({
  ctx: { field, fieldName, col },
}: {
  readonly ctx: CToFieldCtx;
  readonly fieldSpec: CreationTimeFieldSpec;
}): Task<Either<CToFieldErr, None>> {
  return _(field)
    ._(oMap(() => Left(invalidTypeCToFieldErr({ col, field, fieldName }))))
    ._(oeGetOrRight(() => None()))
    ._(Task)
    ._val();
}

export function rToCreationTimeField({
  ctx: { fieldName, field, col },
}: {
  readonly ctx: RToFieldCtx;
  readonly fieldSpec: CreationTimeFieldSpec;
}): Either<RToDocErr, Some<DateField>> {
  return _(field)
    ._(
      oMap((field) =>
        field instanceof Date
          ? _(field)._(DateField)._(toRightSome)._val()
          : Left(invalidTypeRToDocErr({ col, field, fieldName }))
      )
    )
    ._(oeGetOrLeft(() => invalidTypeRToDocErr({ col, field, fieldName })))
    ._val();
}
