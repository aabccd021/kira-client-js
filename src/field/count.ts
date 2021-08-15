import { CountFieldSpec, NumberField } from 'kira-core';
import { Either, Left, None, optionFold, Right, Some } from 'trimop';

import { _, oMap, oToSome } from '../trimop/pipe';
import {
  CToFieldContext,
  CToFieldError,
  InvalidTypeCToFieldError,
  InvalidTypeRToDocError,
  RToDocError,
  RToFieldContext,
} from '../type';

export async function cToCountField({
  context: { field, fieldName, col },
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: CountFieldSpec;
}): Promise<Either<CToFieldError, None>> {
  return _(field)
    ._(oMap(() => Left(InvalidTypeCToFieldError({ col, field, fieldName }))))
    ._(oToSome<Either<CToFieldError, None>>(() => Right(None())))
    .eval();
}

export function rToCountField({
  context: { fieldName, field, col },
}: {
  readonly context: RToFieldContext;
  readonly fieldSpec: CountFieldSpec;
}): Either<RToDocError, Some<NumberField>> {
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
      typeof field === 'number'
        ? Right(Some(NumberField(field)))
        : Left(
            InvalidTypeRToDocError({
              col,
              field,
              fieldName,
            })
          )
  );
}
