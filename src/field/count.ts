import { CountFieldSpec, NumberField } from 'kira-core';
import { Either, Left, None, Right, Some } from 'trimop';

import { _, oGetOrElse, oMap, Task, toRightSome } from '../trimop/pipe';
import {
  CToFieldCtx,
  CToFieldError,
  invalidTypeCToFieldError,
  invalidTypeRToDocError,
  RToDocError,
  RToFieldCtx,
} from '../type';

export function cToCountField({
  ctx: { field, fieldName, col },
}: {
  readonly ctx: CToFieldCtx;
  readonly fieldSpec: CountFieldSpec;
}): Task<Either<CToFieldError, None>> {
  return _(field)
    ._(oMap(() => Left(invalidTypeCToFieldError({ col, field, fieldName }))))
    ._(oGetOrElse<Either<CToFieldError, None>>(() => Right(None())))
    ._(Task)
    ._val();
}

export function rToCountField({
  ctx: { fieldName, field, col },
}: {
  readonly ctx: RToFieldCtx;
  readonly fieldSpec: CountFieldSpec;
}): Either<RToDocError, Some<NumberField>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'number'
          ? _(NumberField(field))._(toRightSome)._val()
          : _(invalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(
      oGetOrElse<Either<RToDocError, Some<NumberField>>>(() =>
        _(invalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._val();
}
