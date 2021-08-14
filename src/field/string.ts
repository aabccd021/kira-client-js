import { StringField, StringFieldSpec } from 'kira-core';
import { Either, Left, Option, optionFold, Right, Some } from 'trimop';

import { CToFieldContext, CToFieldError, InvalidCreationFieldTypeError } from '../type';

export async function cToStringField({
  context: { fieldName, col, field },
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: StringFieldSpec;
}): Promise<Either<CToFieldError, Option<StringField>>> {
  return optionFold(
    field,
    async () =>
      Left(
        InvalidCreationFieldTypeError({
          col,
          fieldName,
          givenFieldValue: field,
        })
      ),
    async (field) =>
      typeof field === 'string'
        ? Right(Some(StringField(field)))
        : Left(
            InvalidCreationFieldTypeError({
              col,
              fieldName,
              givenFieldValue: field,
            })
          )
  );
}
