import { ImageField, ImageFieldSpec, isImageFieldValue } from 'kira-core';
import { Either, Left, Some } from 'trimop';

import {
  _,
  oeGetOrLeft,
  O.map,
  oteGetOrLeft,
  Task,
  teLeft,
  teMap,
  teMapLeft,
  toRightSome,
  toTaskRightSome,
} from '../trimop/function';
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
      O.map((field) =>
        typeof field === 'string'
          ? toTaskRightSome(ImageField({ url: field }))
          : field instanceof File
          ? _(pUploadImage({ col, fieldName, file: field, id }))
              ._(teMap((uploadResult) => Some(ImageField({ url: uploadResult.downloadUrl }))))
              ._(teMapLeft(uploadImageCToFieldErr))
              ._v()
          : teLeft(invalidTypeCToFieldErr({ col, field, fieldName }))
      )
    )
    ._(oteGetOrLeft(() => invalidTypeCToFieldErr({ col, field, fieldName })))
    ._v();
}

export function rToImageField({
  ctx: { fieldName, field, col },
}: {
  readonly ctx: RToFieldCtx;
  readonly fieldSpec: ImageFieldSpec;
}): Either<RToDocErr, Some<ImageField>> {
  return _(field)
    ._(
      O.map((field) =>
        isImageFieldValue(field)
          ? toRightSome(ImageField(field))
          : Left(invalidTypeRToDocErr({ col, field, fieldName }))
      )
    )
    ._(oeGetOrLeft(() => invalidTypeRToDocErr({ col, field, fieldName })))
    ._v();
}
