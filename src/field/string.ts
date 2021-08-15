import { StringField, StringFieldSpec } from 'kira-core';
import { Either, Left, Right, Some } from 'trimop';

import { _, oMap, oToSome, toRightSome } from '../trimop/pipe';
import {
  CToFieldContext,
  CToFieldError,
  InvalidTypeCToFieldError,
  InvalidTypeRToDocError,
  RToDocError,
  RToFieldContext,
} from '../type';

export async function cToStringField({
  context: { fieldName, col, field },
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: StringFieldSpec;
}): Promise<Either<CToFieldError, Some<StringField>>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'string'
          ? Right(Some(StringField(field)))
          : Left(InvalidTypeCToFieldError({ col, field, fieldName }))
      )
    )
    ._(
      oToSome<Either<CToFieldError, Some<StringField>>>(() =>
        Left(InvalidTypeCToFieldError({ col, field, fieldName }))
      )
    )
    .eval();
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
          ? _(StringField(field))._(toRightSome).eval()
          : _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left).eval()
      )
    )
    ._(
      oToSome<Either<RToDocError, Some<StringField>>>(() =>
        _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left).eval()
      )
    )
    .eval();
}
