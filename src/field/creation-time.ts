import { CreationTimeFieldSpec, DateField } from 'kira-core';
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

export function cToCreationTimeField({
  ctx: { field, fieldName, col },
}: {
  readonly ctx: CToFieldCtx;
  readonly fieldSpec: CreationTimeFieldSpec;
}): Task<Either<CToFieldError, None>> {
  return _(field)
    ._(oMap(() => Left(invalidTypeCToFieldError({ col, field, fieldName }))))
    ._(oGetOrElse<Either<CToFieldError, None>>(() => Right(None())))
    ._(Task)
    ._val();
}

export function rToCreationTimeField({
  ctx: { fieldName, field, col },
}: {
  readonly ctx: RToFieldCtx;
  readonly fieldSpec: CreationTimeFieldSpec;
}): Either<RToDocError, Some<DateField>> {
  return _(field)
    ._(
      oMap((field) =>
        field instanceof Date
          ? _(DateField(field))._(toRightSome)._val()
          : _(invalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(
      oGetOrElse<Either<RToDocError, Some<DateField>>>(() =>
        _(invalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._val();
}
