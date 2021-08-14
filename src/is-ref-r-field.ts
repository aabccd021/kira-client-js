import { isImageFieldValue } from 'kira-core';

import { CField, RefRField, RField } from './type';

export function isRefRField(field: RField | CField | undefined): field is RefRField {
  if (field === undefined) {
    return false;
  }
  return (
    typeof (field as RefRField)._id === 'string' &&
    Object.entries(field).every(
      ([, fieldValue]) =>
        typeof fieldValue === 'string' ||
        typeof fieldValue === 'number' ||
        fieldValue instanceof Date ||
        (Array.isArray(fieldValue) && fieldValue.every((el) => typeof el === 'string')) ||
        isImageFieldValue(fieldValue) ||
        isRefRField(fieldValue)
    )
  );
}
