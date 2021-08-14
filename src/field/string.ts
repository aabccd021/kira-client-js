import { StringField, StringFieldSpec } from 'kira-core';
import { Either, Left, Option, optionFold, Right, Some } from 'trimop';

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
}): Promise<Either<CToFieldError, Option<StringField>>> {
  return optionFold(
    field,
    async () => Left(InvalidTypeCToFieldError({ col, field, fieldName })),
    async (field) =>
      typeof field === 'string'
        ? Right(Some(StringField(field)))
        : Left(InvalidTypeCToFieldError({ col, field, fieldName }))
  );
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
