import { CreationTimeFieldSpec, DateField } from 'kira-core';
import { Either, Left, None, Right, Some } from 'trimop';

import { _, oGetOrElse, oMap, Task, toRightSome } from '../trimop/pipe';
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
    ._(oGetOrElse<Either<CToFieldError, None>>(() => Right(None())))
    ._(Task)
    ._val();
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
          ? _(DateField(field))._(toRightSome)._val()
          : _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(
      oGetOrElse<Either<RToDocError, Some<DateField>>>(() =>
        _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._val();
}
