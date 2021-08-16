import { isImageFieldValue, RefField, RefFieldSpec } from 'kira-core';
import { Either, Left, Option } from 'trimop';

import { _, eMap, eMapLeft, oGetOrElse, oMap, Task } from '../trimop/pipe';
import {
  CField,
  CToFieldCtx,
  CToFieldErr,
  CToFieldRToDocErr,
  CToFieldUserNotSignedInErr,
  GetAuthState,
  invalidTypeCToFieldErr,
  invalidTypeRToDocErr,
  RefRField,
  RField,
  RToDoc,
  RToDocErr,
  RToFieldCtx,
} from '../type';

function isRefRField(field: RField | CField | undefined): field is RefRField {
  if (field === undefined) {
    return false;
  }
  return (
    typeof (field as RefRField)._id === 'string' &&
    Object.entries(field as RefRField).every(
      ([, fieldValue]) =>
        typeof fieldValue === 'string' ||
        typeof fieldValue === 'number' ||
        fieldValue instanceof Date ||
        isImageFieldValue(fieldValue) ||
        isRefRField(fieldValue)
    )
  );
}

//TODO: Owner field for better tree shaking
export function cToRefField({
  ctx: { fieldName, col, field },
  fieldSpec,
  getAuthState,
  rToDoc,
}: {
  readonly ctx: CToFieldCtx;
  readonly fieldSpec: RefFieldSpec;
  readonly getAuthState: GetAuthState;
  readonly rToDoc: RToDoc;
}): Task<Either<CToFieldErr, Option<RefField>>> {
  return _(field)
    ._(
      oMap((rDoc) =>
        fieldSpec.isOwner
          ? _(getAuthState())
              ._(
                oMap((auth) =>
                  auth.state === 'signedIn'
                    ? _(rToDoc(col, auth.user))
                        ._(
                          eMap((doc) =>
                            _(doc)
                              ._(oMap((doc) => RefField({ doc, id: auth.userId })))
                              ._val()
                          )
                        )
                        ._(eMapLeft(CToFieldRToDocErr))
                        ._val()
                    : _(CToFieldUserNotSignedInErr({ signInRequired: `create ${col} doc` }))
                        ._(Left)
                        ._val()
                )
              )
              ._(
                oGetOrElse<Either<CToFieldErr, Option<RefField>>>(() =>
                  _(CToFieldUserNotSignedInErr({ signInRequired: `create ${col} doc` }))
                    ._(Left)
                    ._val()
                )
              )
              ._val()
          : isRefRField(rDoc)
          ? _(rToDoc(col, rDoc))
              ._(
                eMap((doc) =>
                  _(doc)
                    ._(oMap((doc) => RefField({ doc, id: rDoc._id })))
                    ._val()
                )
              )
              ._(eMapLeft(CToFieldRToDocErr))
              ._val()
          : _(invalidTypeCToFieldErr({ col, field: rDoc, fieldName }))
              ._(Left)
              ._val()
      )
    )
    ._(
      oGetOrElse<Either<CToFieldErr, Option<RefField>>>(() =>
        _(invalidTypeCToFieldErr({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(Task)
    ._val();
}

export function rToRefField({
  ctx: { fieldName, field, col },
  rToDoc,
}: {
  readonly ctx: RToFieldCtx;
  readonly fieldSpec: RefFieldSpec;
  readonly rToDoc: RToDoc;
}): Either<RToDocErr, Option<RefField>> {
  return _(field)
    ._(
      oMap((field) =>
        isRefRField(field)
          ? _(rToDoc(col, field))
              ._(
                eMap((doc) =>
                  _(doc)
                    ._(oMap((doc) => RefField({ doc, id: field._id })))
                    ._val()
                )
              )
              ._val()
          : _(invalidTypeRToDocErr({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._(
      oGetOrElse<Either<RToDocErr, Option<RefField>>>(() =>
        _(invalidTypeRToDocErr({ col, field, fieldName }))._(Left)._val()
      )
    )
    ._val();
}
