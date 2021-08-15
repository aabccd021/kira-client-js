import { isImageFieldValue, RefField, RefFieldSpec } from 'kira-core';
import { Either, Left, Option } from 'trimop';

import { _, eMap, eMapLeftTo, oMap, oToSome, Task } from '../trimop/pipe';
import {
  CField,
  CToFieldContext,
  CToFieldError,
  CToFieldRToDocError,
  CToFieldUserNotSignedInError,
  GetAuthState,
  InvalidTypeCToFieldError,
  InvalidTypeRToDocError,
  RefRField,
  RField,
  RToDoc,
  RToDocError,
  RToFieldContext,
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
  context: { fieldName, col, field },
  fieldSpec,
  getAuthState,
  rToDoc,
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: RefFieldSpec;
  readonly getAuthState: GetAuthState;
  readonly rToDoc: RToDoc;
}): Task<Either<CToFieldError, Option<RefField>>> {
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
                              .value()
                          )
                        )
                        ._(eMapLeftTo(CToFieldRToDocError))
                        .value()
                    : _(CToFieldUserNotSignedInError({ signInRequired: `create ${col} doc` }))
                        ._(Left)
                        .value()
                )
              )
              ._(
                oToSome<Either<CToFieldError, Option<RefField>>>(() =>
                  _(CToFieldUserNotSignedInError({ signInRequired: `create ${col} doc` }))
                    ._(Left)
                    .value()
                )
              )
              .value()
          : isRefRField(rDoc)
          ? _(rToDoc(col, rDoc))
              ._(
                eMap((doc) =>
                  _(doc)
                    ._(oMap((doc) => RefField({ doc, id: rDoc._id })))
                    .value()
                )
              )
              ._(eMapLeftTo(CToFieldRToDocError))
              .value()
          : _(InvalidTypeCToFieldError({ col, field: rDoc, fieldName }))
              ._(Left)
              .value()
      )
    )
    ._(
      oToSome<Either<CToFieldError, Option<RefField>>>(() =>
        _(InvalidTypeCToFieldError({ col, field, fieldName }))._(Left).value()
      )
    )
    ._(Task)
    .value();
}

export function rToRefField({
  context: { fieldName, field, col },
  rToDoc,
}: {
  readonly context: RToFieldContext;
  readonly fieldSpec: RefFieldSpec;
  readonly rToDoc: RToDoc;
}): Either<RToDocError, Option<RefField>> {
  return _(field)
    ._(
      oMap((field) =>
        isRefRField(field)
          ? _(rToDoc(col, field))
              ._(
                eMap((doc) =>
                  _(doc)
                    ._(oMap((doc) => RefField({ doc, id: field._id })))
                    .value()
                )
              )
              .value()
          : _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left).value()
      )
    )
    ._(
      oToSome<Either<RToDocError, Option<RefField>>>(() =>
        _(InvalidTypeRToDocError({ col, field, fieldName }))._(Left).value()
      )
    )
    .value();
}
