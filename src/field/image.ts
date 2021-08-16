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
  CToFieldErr,
  invalidTypeCToFieldErr,
  invalidTypeRToDocErr,
  PUploadImage,
  PUploadImageErr,
  RToDocErr,
  RToFieldCtx,
  uploadImageCToFieldErr,
} from '../type';

export function cToImageField<PUIE extends PUploadImageErr>({
  ctx: { fieldName, id, col, field },
  pUploadImage,
}: {
  readonly ctx: CToFieldCtx;
  readonly fieldSpec: ImageFieldSpec;
  readonly pUploadImage: PUploadImage<PUIE>;
}): Task<Either<CToFieldErr, Some<ImageField>>> {
  return _(field)
    ._(
      oMap((field) =>
        typeof field === 'string'
          ? toTaskRightSome(ImageField({ url: field }))
          : field instanceof File
          ? _(pUploadImage({ col, fieldName, file: field, id }))
              ._(
                tMap((res) =>
                  _(res)
                    ._(eMap((uploadResult) => Some(ImageField({ url: uploadResult.downloadUrl }))))
                    ._(eMapLeft(uploadImageCToFieldErr))
                    ._val()
                )
              )
              ._val()
          : teLeft(invalidTypeCToFieldErr({ col, field, fieldName }))
      )
    )
    ._(
      oGetOrElse<Task<Either<CToFieldErr, Some<ImageField>>>>(() =>
        teLeft(invalidTypeCToFieldErr({ col, field, fieldName }))
      )
    )
    ._val();
}

export function rToImageField({
  ctx: { fieldName, field, col },
}: {
  readonly ctx: RToFieldCtx;
  readonly fieldSpec: ImageFieldSpec;
}): Either<RToDocErr, Some<ImageField>> {
  return _(field)
    ._(
      oMap((field) =>
        isImageFieldValue(field)
          ? toRightSome(ImageField(field))
          : Left(invalidTypeRToDocErr({ col, field, fieldName }))
      )
    )
    ._(
      oGetOrElse<Either<RToDocErr, Some<ImageField>>>(() =>
        Left(invalidTypeRToDocErr({ col, field, fieldName }))
      )
    )
    ._val();
}
