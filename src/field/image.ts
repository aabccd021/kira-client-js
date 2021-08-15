import { ImageField, ImageFieldSpec, isImageFieldValue } from 'kira-core';
import { Either, eitherFold, Left, optionFold, Right, Some } from 'trimop';

import {
  AuthContext,
  CToFieldContext,
  CToFieldError,
  CToFieldUploadImageError,
  GetAuthState,
  InvalidTypeCToFieldError,
  InvalidTypeRToDocError,
  PUploadImage,
  PUploadImageError,
  RToDocError,
  RToFieldContext,
} from '../type';

export async function cToImageField<PUIE extends PUploadImageError>({
  context: { fieldName, id, col, field },
  getAuthState,
  pUploadImage,
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: ImageFieldSpec;
  readonly getAuthState: GetAuthState;
  readonly pUploadImage: PUploadImage<PUIE>;
}): Promise<Either<CToFieldError, Some<ImageField>>> {
  return optionFold(
    field,
    async () =>
      Left(
        InvalidTypeCToFieldError({
          col,
          field,
          fieldName,
          message: 'empty',
        })
      ),
    async (field) => {
      if (typeof field === 'string') {
        return Right(Some(ImageField({ url: field })));
      }

      if (field instanceof File) {
        return eitherFold(
          await pUploadImage({
            auth: optionFold(
              getAuthState(),
              () => ({ state: 'signedOut' } as AuthContext),
              (auth) =>
                auth.state === 'signedIn' || auth.state === 'loadingUserData'
                  ? { id: auth.userId, state: 'signedIn' }
                  : { state: 'signedOut' }
            ),
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
        InvalidTypeCToFieldError({
          col,
          field,
          fieldName,
          message: 'wrong type',
        })
      );
    }
  );
}

export function rToImageField({
  context: { fieldName, field, col },
}: {
  readonly context: RToFieldContext;
  readonly fieldSpec: ImageFieldSpec;
}): Either<RToDocError, Some<ImageField>> {
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
      isImageFieldValue(field)
        ? Right(Some(ImageField(field)))
        : Left(
            InvalidTypeRToDocError({
              col,
              field,
              fieldName,
            })
          )
  );
}
