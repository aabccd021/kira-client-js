import { CountFieldSpec, NumberField } from 'kira-core';
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

export function cToCountField({
  context: { field, fieldName, col },
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: CountFieldSpec;
}): Task<Either<CToFieldError, None>> {
  return _(field)
    ._(oMap(() => Left(InvalidTypeCToFieldError({ col, field, fieldName }))))
    ._(oToSome<Either<CToFieldError, None>>(() => Right(None())))
    ._(Task)
    ._val();
}

export function rToCountField({
  context: { fieldName, field, col },
}: {
  readonly context: RToFieldContext;
  readonly fieldSpec: CountFieldSpec;
}): Either<RToDocError, Some<NumberField>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'number'
          ? _(NumberField(field))._(toRightSome)._val()
          : _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(
      oToSome<Either<RToDocError, Some<NumberField>>>(() =>
        _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._val();
}
