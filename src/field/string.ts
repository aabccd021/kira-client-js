import { StringField, StringFieldSpec } from 'kira-core';
import { Either, Left, optionFold, Right, Some } from 'trimop';

import { _, oMap, oToSome } from '../trimop/pipe';
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
  return optionFold(
    field,
    () =>
      Left(
        InvalidTypeRToDocError({
          col,
          field,
          fieldName,
        })
      ),
    (field) =>
      typeof field === 'string'
        ? Right(Some(StringField(field)))
        : Left(
            InvalidTypeRToDocError({
              col,
              field,
              fieldName,
            })
          )
  );
}
