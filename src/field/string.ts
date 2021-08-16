import { StringField, StringFieldSpec } from 'kira-core';
import { Either, Left, Some } from 'trimop';

import { _, oGetOrElse, oMap, Task, toRightSome } from '../trimop/pipe';
import {
  CToFieldCtx,
  CToFieldErr,
  invalidTypeCToFieldErr,
  invalidTypeRToDocErr,
  RToDocErr,
  RToFieldCtx,
} from '../type';

export function cToStringField({
  ctx: { fieldName, col, field },
}: {
  readonly ctx: CToFieldCtx;
  readonly fieldSpec: StringFieldSpec;
}): Task<Either<CToFieldErr, Some<StringField>>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'string'
          ? _(field)._(StringField)._(toRightSome)._val()
          : Left(invalidTypeCToFieldErr({ col, field, fieldName }))
      )
    )
    ._(
      oGetOrElse<Either<CToFieldErr, Some<StringField>>>(() =>
        Left(invalidTypeCToFieldErr({ col, field, fieldName }))
      )
    )
    ._(Task)
    ._val();
}

export function rToStringField({
  ctx: { fieldName, field, col },
}: {
  readonly ctx: RToFieldCtx;
  readonly fieldSpec: StringFieldSpec;
}): Either<RToDocErr, Some<StringField>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'string'
          ? _(field)._(StringField)._(toRightSome)._val()
          : Left(invalidTypeRToDocErr({ col, field, fieldName }))
      )
    )
    ._(
      oGetOrElse<Either<RToDocErr, Some<StringField>>>(() =>
        Left(invalidTypeRToDocErr({ col, field, fieldName }))
      )
    )
    ._val();
}
