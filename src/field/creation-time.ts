import { CreationTimeFieldSpec, DateField } from 'kira-core';
import { Either, Left, None, Right, Some } from 'trimop';

import { _, oMap, oToSome, toRightSome } from '../trimop/pipe';
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
  return _(field)
    ._(oMap(() => Left(InvalidTypeCToFieldError({ col, field, fieldName }))))
    ._(oToSome<Either<CToFieldError, None>>(() => Right(None())))
    .eval();
}

export function rToCreationTimeField({
  context: { fieldName, field, col },
}: {
  readonly context: RToFieldContext;
  readonly fieldSpec: CreationTimeFieldSpec;
}): Either<RToDocError, Some<DateField>> {
  return _(field)
    ._(
      oMap((field) =>
        field instanceof Date
          ? _(DateField(field))._(toRightSome).eval()
          : _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left).eval()
      )
    )
    ._(
      oToSome<Either<RToDocError, Some<DateField>>>(() =>
        _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left).eval()
      )
    )
    .eval();
}
