import { ImageField, ImageFieldSpec, isImageFieldValue } from 'kira-core';
import { Either, Left, Some } from 'trimop';

import {
  _,
  eMap,
  eMapLeft,
  oMap,
  oToSome,
  Task,
  tMap,
  toRightSome,
  toTaskLeft,
  toTaskRightSome,
} from '../trimop/pipe';
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
    ._(
      oMap((field) =>
        typeof field === 'string'
          ? _(ImageField({ url: field }))
              ._(toTaskRightSome)
              ._val()
          : field instanceof File
          ? _(pUploadImage({ col, fieldName, file: field, id }))
              ._(
                tMap((res) =>
                  _(res)
                    ._(
                      eMap((uploadResult) =>
                        _(ImageField({ url: uploadResult.downloadUrl }))
                          ._(Some)
                          ._val()
                      )
                    )
                    ._(eMapLeft(CToFieldUploadImageError))
                    ._val()
                )
              )
              ._val()
          : _(InvalidTypeCToFieldError({ col, field, fieldName }))._(toTaskLeft)._val()
      )
    )
    ._(
      oToSome<Task<Either<CToFieldError, Some<ImageField>>>>(() =>
        _(InvalidTypeCToFieldError({ col, field, fieldName }))._(toTaskLeft)._val()
      )
    )
    ._val();
}

export function rToImageField({
  context: { fieldName, field, col },
}: {
  readonly context: RToFieldContext;
  readonly fieldSpec: ImageFieldSpec;
}): Either<RToDocError, Some<ImageField>> {
  return _(field)
    ._(
      oMap((field) =>
        isImageFieldValue(field)
          ? _(ImageField(field))._(toRightSome)._val()
          : _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(
      oToSome<Either<RToDocError, Some<ImageField>>>(() =>
        _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._val();
}
