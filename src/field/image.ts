import { ImageField, ImageFieldSpec, isImageFieldValue } from 'kira-core';
import { Either, Left, Some } from 'trimop';

import {
  _,
  eMap,
  eMapLeft,
  oGetOrElse,
  oMap,
  Task,
  teLeft,
  tMap,
  toRightSome,
  toTaskRightSome,
} from '../trimop/pipe';
import {
  CToFieldCtx,
  CToFieldError,
  CToFieldUploadImageError,
  invalidTypeCToFieldError,
  invalidTypeRToDocError,
  PUploadImage,
  PUploadImageError,
  RToDocError,
  RToFieldCtx,
} from '../type';

export function cToImageField<PUIE extends PUploadImageError>({
  ctx: { fieldName, id, col, field },
  pUploadImage,
}: {
  readonly ctx: CToFieldCtx;
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
          : _(invalidTypeCToFieldError({ col, field, fieldName }))._(teLeft)._val()
      )
    )
    ._(
      oGetOrElse<Task<Either<CToFieldError, Some<ImageField>>>>(() =>
        _(invalidTypeCToFieldError({ col, field, fieldName }))._(teLeft)._val()
      )
    )
    ._val();
}

export function rToImageField({
  ctx: { fieldName, field, col },
}: {
  readonly ctx: RToFieldCtx;
  readonly fieldSpec: ImageFieldSpec;
}): Either<RToDocError, Some<ImageField>> {
  return _(field)
    ._(
      oMap((field) =>
        isImageFieldValue(field)
          ? _(ImageField(field))._(toRightSome)._val()
          : _(invalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(
      oGetOrElse<Either<RToDocError, Some<ImageField>>>(() =>
        _(invalidTypeRToDocError({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._val();
}
