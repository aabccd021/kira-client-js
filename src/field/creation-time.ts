import { CreationTimeFieldSpec, DateField } from 'kira-core';
import { Either, Left, None, Right, Some } from 'trimop';

import { _, oGetOrElse, oMap, Task, toRightSome } from '../trimop/pipe';
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
    ._(oGetOrElse<Either<CToFieldErr, None>>(() => Right(None())))
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
    ._(
      oGetOrElse<Either<RToDocErr, Some<DateField>>>(() =>
        Left(invalidTypeRToDocErr({ col, field, fieldName }))
      )
    )
    ._val();
}
