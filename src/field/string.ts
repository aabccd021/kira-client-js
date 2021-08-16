import { StringField, StringFieldSpec } from 'kira-core';
import { Either, Left, Right, Some } from 'trimop';

import { _, oGetOrElse, oMap, Task, toRightSome } from '../trimop/pipe';
import {
  CToFieldCtx,
  CToFieldError,
  invalidTypeCToFieldError,
  invalidTypeRToDocError,
  RToDocError,
  RToFieldCtx,
} from '../type';

export function cToStringField({
  ctx: { fieldName, col, field },
}: {
  readonly ctx: CToFieldCtx;
  readonly fieldSpec: StringFieldSpec;
}): Task<Either<CToFieldError, Some<StringField>>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'string'
          ? Right(Some(StringField(field)))
          : Left(invalidTypeCToFieldError({ col, field, fieldName }))
      )
    )
    ._(
      oGetOrElse<Either<CToFieldError, Some<StringField>>>(() =>
        Left(invalidTypeCToFieldError({ col, field, fieldName }))
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
}): Either<RToDocError, Some<StringField>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'string'
          ? _(StringField(field))._(toRightSome)._val()
          : _(invalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(
      oGetOrElse<Either<RToDocError, Some<StringField>>>(() =>
        _(invalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._val();
}
