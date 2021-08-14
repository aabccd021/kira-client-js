import { CreationTimeFieldSpec } from 'kira-core';
import { Either, None, Right } from 'trimop';

import { CToFieldContext, CToFieldError } from '../type';

export async function cToCreationTimeField(_: {
  readonly context: CToFieldContext;
  readonly fieldSpec: CreationTimeFieldSpec;
}): Promise<Either<CToFieldError, None>> {
  return Right(None());
}
