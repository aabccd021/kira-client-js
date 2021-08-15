import { CreationTimeFieldSpec, DateField } from 'kira-core';
import { Either, Left, None, Right, Some } from 'trimop';

import { _, oMap, oToSome, Task, toRightSome } from '../trimop/pipe';
import {
  CToFieldContext,
  CToFieldError,
  InvalidTypeCToFieldError,
  InvalidTypeRToDocError,
  RToDocError,
  RToFieldContext,
} from '../type';

export function cToCreationTimeField({
  context: { field, fieldName, col },
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: CreationTimeFieldSpec;
}): Task<Either<CToFieldError, None>> {
  return _(field)
    ._(oMap(() => Left(InvalidTypeCToFieldError({ col, field, fieldName }))))
    ._(oToSome<Either<CToFieldError, None>>(() => Right(None())))
    ._(Task)
    .value();
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
          ? _(DateField(field))._(toRightSome).value()
          : _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left).value()
      )
    )
    ._(
      oToSome<Either<RToDocError, Some<DateField>>>(() =>
        _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left).value()
      )
    )
    .value();
}
