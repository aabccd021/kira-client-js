import { CountFieldSpec } from 'kira-core';
import { Either, None, Right } from 'trimop';

import { CToFieldContext, CToFieldError, RToFieldContext } from '../type';

export async function cToCountField(_: {
  readonly context: CToFieldContext;
  readonly fieldSpec: CountFieldSpec;
}): Promise<Either<CToFieldError, None>> {
  return Right(None());
}

export async function rToCountField(_: {
  readonly context: RToFieldContext;
  readonly fieldSpec: CountFieldSpec;
}): Promise<Either<CToFieldError, None>> {
  return Right(None());
}
