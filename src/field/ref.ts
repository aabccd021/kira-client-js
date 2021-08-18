import { isImageFieldValue, RefField, RefFieldSpec } from 'kira-core';
import { Either, Left, Option, Some } from 'trimop';

import { _, eMap, eMapLeft, oeGetOrLeft, O.map, Task } from '../trimop/function';
import {
  CField,
  CToFieldCtx,
  CToFieldErr,
  GetAuthState,
  invalidTypeCToFieldErr,
  invalidTypeRToDocErr,
  RefRField,
  RField,
  RToDoc,
  rToDocCToFieldErr,
  RToDocErr,
  RToFieldCtx,
  userNotSignedInCToFieldErr,
} from '../type';

function isRefRField(field: RField | CField): field is RefRField {
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
}): Task<Either<CToFieldErr, Some<RefField>>> {
  return _(field)
    ._(
      O.map((rDoc) =>
        fieldSpec.isOwner
          ? _(getAuthState())
              ._(
                O.map((auth) =>
                  auth.state === 'signedIn'
                    ? _(auth.user)
                        ._(rToDoc(col))
                        ._(eMap((doc) => Some(RefField({ doc, id: auth.userId }))))
                        ._(eMapLeft(rToDocCToFieldErr))
                        ._v()
                    : Left(userNotSignedInCToFieldErr(`create ${col} doc`))
                )
              )
              ._(oeGetOrLeft(() => userNotSignedInCToFieldErr(`create ${col} doc`)))
              ._v()
          : isRefRField(rDoc)
          ? _(rDoc)
              ._(rToDoc(col))
              ._(eMap((doc) => Some(RefField({ doc, id: rDoc._id }))))
              ._(eMapLeft(rToDocCToFieldErr))
              ._v()
          : Left(invalidTypeCToFieldErr({ col, field: rDoc, fieldName }))
      )
    )
    ._(oeGetOrLeft(() => invalidTypeCToFieldErr({ col, field, fieldName })))
    ._(Task)
    ._v();
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
      O.map((field) =>
        isRefRField(field)
          ? _(field)
              ._(rToDoc(col))
              ._(eMap((doc) => Some(RefField({ doc, id: field._id }))))
              ._v()
          : Left(invalidTypeRToDocErr({ col, field, fieldName }))
      )
    )
    ._(oeGetOrLeft(() => invalidTypeRToDocErr({ col, field, fieldName })))
    ._v();
}
