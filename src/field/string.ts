import { StringField, StringFieldSpec } from 'kira-core';
import { Either, Left, Right, Some } from 'trimop';

import { _, oGetOrElse, oMap, Task, toRightSome } from '../trimop/pipe';
import {
  CToFieldContext,
  CToFieldError,
  InvalidTypeCToFieldError,
  InvalidTypeRToDocError,
  RToDocError,
  RToFieldContext,
} from '../type';

export function cToStringField({
  context: { fieldName, col, field },
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: StringFieldSpec;
}): Task<Either<CToFieldError, Some<StringField>>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'string'
          ? Right(Some(StringField(field)))
          : Left(InvalidTypeCToFieldError({ col, field, fieldName }))
      )
    )
    ._(
      oGetOrElse<Either<CToFieldError, Some<StringField>>>(() =>
        Left(InvalidTypeCToFieldError({ col, field, fieldName }))
      )
    )
    ._(Task)
    ._val();
}

export function rToStringField({
  context: { fieldName, field, col },
}: {
  readonly context: RToFieldContext;
  readonly fieldSpec: StringFieldSpec;
}): Either<RToDocError, Some<StringField>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'string'
          ? _(StringField(field))._(toRightSome)._val()
          : _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(
      oGetOrElse<Either<RToDocError, Some<StringField>>>(() =>
        _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._val();
}
