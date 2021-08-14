import { CreationTimeFieldSpec, DateField } from 'kira-core';
import { Either, Left, None, optionFold, Right, Some } from 'trimop';

import {
  CToFieldContext,
  CToFieldError,
  InvalidTypeCToFieldError,
  InvalidTypeRToDocError,
  RToDocError,
  RToFieldContext,
} from '../type';

export async function cToCreationTimeField({
  context: { field, fieldName, col },
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: CreationTimeFieldSpec;
}): Promise<Either<CToFieldError, None>> {
  return optionFold(
    field,
    () => Right(None()) as Either<CToFieldError, None>,
    () => Left(InvalidTypeCToFieldError({ col, field, fieldName }))
  );
}

export function rToCreationTimeField({
  context: { fieldName, field, col },
}: {
  readonly context: RToFieldContext;
  readonly fieldSpec: CreationTimeFieldSpec;
}): Either<RToDocError, Some<DateField>> {
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
      field instanceof Date
        ? Right(Some(DateField(field)))
        : Left(
            InvalidTypeRToDocError({
              col,
              field,
              fieldName,
            })
          )
  );
}
