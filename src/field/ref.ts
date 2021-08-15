import { isImageFieldValue, RefField, RefFieldSpec } from 'kira-core';
import {
  Either,
  eitherMapRight,
  Left,
  Option,
  optionFold,
  optionMapSome,
  Right,
  Some,
} from 'trimop';

import { _, eMap, eMapLeft, leftTo, oMap, oToSome, Task } from '../trimop/pipe';
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
                              .eval()
                          )
                        )
                        ._(eMapLeft(leftTo(CToFieldRToDocError)))
                        .eval()
                    : _(CToFieldUserNotSignedInError({ signInRequired: `create ${col} doc` }))
                        ._(Left)
                        .eval()
                )
              )
              ._(
                oToSome<Either<CToFieldError, Option<RefField>>>(() =>
                  _(CToFieldUserNotSignedInError({ signInRequired: `create ${col} doc` }))
                    ._(Left)
                    .eval()
                )
              )
              .eval()
          : isRefRField(rDoc)
          ? _(rToDoc(col, rDoc))
              ._(
                eMap((doc) =>
                  _(doc)
                    ._(oMap((doc) => RefField({ doc, id: rDoc._id })))
                    .eval()
                )
              )
              ._(eMapLeft(leftTo(CToFieldRToDocError)))
              .eval()
          : _(InvalidTypeCToFieldError({ col, field: rDoc, fieldName }))
              ._(Left)
              .eval()
      )
    )
    ._(
      oToSome<Either<CToFieldError, Option<RefField>>>(() =>
        _(InvalidTypeCToFieldError({ col, field, fieldName }))._(Left).eval()
      )
    )
    ._(Task)
    .eval();
}

export function rToRefField({
  context: { fieldName, field, col },
  rToDoc,
}: {
  readonly context: RToFieldContext;
  readonly fieldSpec: RefFieldSpec;
  readonly rToDoc: RToDoc;
}): Either<RToDocError, Option<RefField>> {
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
      isRefRField(field)
        ? eitherMapRight(rToDoc(col, field), (doc) =>
            Right(optionMapSome(doc, (doc) => Some(RefField({ doc, id: field._id }))))
          )
        : Left(
            InvalidTypeRToDocError({
              col,
              field,
              fieldName,
            })
          )
  );
}
