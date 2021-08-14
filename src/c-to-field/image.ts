import { ImageField, ImageFieldSpec } from 'kira-core';
import { Either, eitherFold, Left, Right, Some } from 'trimop';

import {
  CField,
  CToFieldContext2,
  CToFieldError,
  CToFieldUploadImageError,
  GetAuthState,
  InvalidCreationFieldTypeError,
  PUploadImage,
  PUploadImageError,
} from '../type';

export async function cToImageField<PUIE extends PUploadImageError>({
  context: { fieldName, id, col },
  getAuthState,
  pUploadImage,
  field,
}: {
  readonly context: CToFieldContext2;
  readonly field: CField;
  readonly fieldSpec: ImageFieldSpec;
  readonly getAuthState: GetAuthState;
  readonly pUploadImage: PUploadImage<PUIE>;
}): Promise<Either<CToFieldError, Some<ImageField>>> {
  if (typeof field === 'string') {
    return Right(Some(ImageField({ url: field })));
  }

  if (field instanceof File) {
    const auth = getAuthState();
    return eitherFold(
      await pUploadImage({
        auth:
          auth.state === 'signedIn' || auth.state === 'loadingUserData'
            ? { id: auth.userId, state: 'signedIn' }
            : { state: 'signedOut' },
        col,
        fieldName,
        file: field,
        id,
      }),
      (pUploadImageError) =>
        Left(CToFieldUploadImageError(pUploadImageError)) as Either<
          CToFieldError,
          Some<ImageField>
        >,
      ({ downloadUrl }) => Right(Some(ImageField({ url: downloadUrl })))
    );
  }

  return Left(
    InvalidCreationFieldTypeError({
      col,
      fieldName,
      givenFieldValue: field,
    })
  );
}
