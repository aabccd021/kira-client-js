import { RefField, RefFieldSpec } from 'kira-core';
import { Either, Left, Option, Right, Some } from 'trimop';

import { isRefRField } from '../is-ref-r-field';
import {
  CField,
  CToFieldContext2,
  CToFieldError,
  CToFieldUserNotSignedInError,
  GetAuthState,
  InvalidCreationFieldTypeError,
  RToDoc,
} from '../type';

export async function cToRefField({
  context: { fieldName, col },
  field: rDoc,
  fieldSpec,
  getAuthState,
  rToDoc,
}: {
  readonly context: CToFieldContext2;
  readonly field: CField;
  readonly fieldSpec: RefFieldSpec;
  readonly getAuthState: GetAuthState;
  readonly rToDoc: RToDoc;
}): Promise<Either<CToFieldError, Option<RefField>>> {
  if (fieldSpec.isOwner) {
    const auth = getAuthState();
    return auth.state === 'signedIn'
      ? Right(
          Some(
            RefField({
              doc: rToDoc(auth.user),
              id: auth.userId,
            })
          )
        )
      : Left(CToFieldUserNotSignedInError({ signInRequired: `create ${col} doc` }));
  }
  return isRefRField(rDoc)
    ? Right(
        Some(
          RefField({
            doc: rToDoc(rDoc),
            id: rDoc._id,
          })
        )
      )
    : Left(
        InvalidCreationFieldTypeError({
          col,
          fieldName,
          givenFieldValue: rDoc,
        })
      );
}
