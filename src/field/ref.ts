import { isImageFieldValue, RefField, RefFieldSpec } from 'kira-core';
import {
  Either,
  eitherFold,
  eitherMapRight,
  Left,
  Option,
  optionFold,
  optionMapSome,
  Right,
  Some,
} from 'trimop';

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

export async function cToRefField({
  context: { fieldName, col, field },
  fieldSpec,
  getAuthState,
  rToDoc,
}: {
  readonly context: CToFieldContext;
  readonly fieldSpec: RefFieldSpec;
  readonly getAuthState: GetAuthState;
  readonly rToDoc: RToDoc;
}): Promise<Either<CToFieldError, Option<RefField>>> {
  return optionFold(
    field,
    async () =>
      Left(
        InvalidTypeCToFieldError({
          col,
          field,
          fieldName,
        })
      ),
    async (rDoc) => {
      if (fieldSpec.isOwner) {
        const auth = getAuthState();
        return auth.state === 'signedIn'
          ? eitherFold(
              rToDoc(col, auth.user),
              (left) => Left(CToFieldRToDocError(left)) as Either<CToFieldError, Option<RefField>>,
              (doc) =>
                Right(
                  optionMapSome(doc, (doc) =>
                    Some(
                      RefField({
                        doc,
                        id: auth.userId,
                      })
                    )
                  )
                )
            )
          : Left(CToFieldUserNotSignedInError({ signInRequired: `create ${col} doc` }));
      }
      return isRefRField(rDoc)
        ? eitherFold(
            rToDoc(col, rDoc),
            (left) => Left(CToFieldRToDocError(left)) as Either<CToFieldError, Option<RefField>>,
            (doc) =>
              Right(
                optionMapSome(doc, (doc) =>
                  Some(
                    RefField({
                      doc,
                      id: rDoc._id,
                    })
                  )
                )
              )
          )
        : Left(
            InvalidTypeCToFieldError({
              col,
              field: rDoc,
              fieldName,
            })
          );
    }
  );
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
