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
  CToFieldUploadImageErr,
  invalidTypeCToFieldErr,
  invalidTypeRToDocErr,
  PUploadImage,
  PUploadImageErr,
  RToDocErr,
  RToFieldCtx,
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
                    ._(eMapLeft(CToFieldUploadImageErr))
                    ._val()
                )
              )
              ._val()
          : _(invalidTypeCToFieldErr({ col, field, fieldName }))._(teLeft)._val()
      )
    )
    ._(
      oGetOrElse<Task<Either<CToFieldErr, Some<ImageField>>>>(() =>
        _(invalidTypeCToFieldErr({ col, field, fieldName }))._(teLeft)._val()
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
          ? _(ImageField(field))._(toRightSome)._val()
          : _(invalidTypeRToDocErr({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(
      oGetOrElse<Either<RToDocErr, Some<ImageField>>>(() =>
        _(invalidTypeRToDocErr({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._val();
}
