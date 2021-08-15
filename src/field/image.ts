import { ImageField, ImageFieldSpec, isImageFieldValue } from 'kira-core';
import { Either, Left, Option, optionFold, Right, Some } from 'trimop';

import { _, eMapC, eMapLeft, leftTo, oMap, oToSome, Task, tMapC } from '../trimop/pipe';
import {
  CToFieldContext,
  CToFieldError,
  CToFieldUploadImageError,
  InvalidTypeCToFieldError,
  InvalidTypeRToDocError,
  PUploadImage,
  PUploadImageError,
  RToDocError,
  RToFieldContext,
} from '../type';

export function cToImageField<PUIE extends PUploadImageError>({
  context: { fieldName, id, col, field },
  pUploadImage,
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: ImageFieldSpec;
  readonly pUploadImage: PUploadImage<PUIE>;
}): Task<Either<CToFieldError, Some<ImageField>>> {
  return _(field)
    ._<Option<Task<Either<CToFieldError, Some<ImageField>>>>>(
      oMap((field) =>
        typeof field === 'string'
          ? _({ url: field })._(ImageField)._(Some)._(Right)._(Task).eval()
          : field instanceof File
          ? _({ col, fieldName, file: field, id })
              ._(pUploadImage)
              ._(
                tMapC((res) =>
                  res
                    ._(eMapC(({ downloadUrl }) => _({ url: downloadUrl })._(ImageField)._(Some)))
                    ._(eMapLeft(leftTo(CToFieldUploadImageError)))
                )
              )
              .eval()
          : _({
              col,
              field,
              fieldName,
              message: 'wrong type',
            })
              ._(InvalidTypeCToFieldError)
              ._(Left)
              ._(Task)
              .eval()
      )
    )
    ._(
      oToSome<Task<Either<CToFieldError, Some<ImageField>>>>(() =>
        Task(Left(InvalidTypeCToFieldError({ col, field, fieldName })))
      )
    )
    .eval();
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
