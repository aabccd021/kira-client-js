import { StringField, StringFieldSpec } from 'kira-core';
import { Either, Left, Option, Right, Some } from 'trimop';

import { CField, CToFieldContext2, CToFieldError, InvalidCreationFieldTypeError } from '../type';

export async function cToStringField({
  context: { fieldName, col },
  field,
}: {
  readonly context: CToFieldContext2;
  readonly field: CField;
  readonly fieldSpec: StringFieldSpec;
}): Promise<Either<CToFieldError, Option<StringField>>> {
  return typeof field === 'string'
    ? Right(Some(StringField(field)))
    : Left(
        InvalidCreationFieldTypeError({
          col,
          fieldName,
          givenFieldValue: field,
        })
      );
}
