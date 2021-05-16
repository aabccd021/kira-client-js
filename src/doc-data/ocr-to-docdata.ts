import assertNever from 'assert-never';

import { DocData, OCRDocData } from '../types';
import { mapValues } from '../util';

export function ocrToDocData(ocrDocData: OCRDocData): DocData {
  return mapValues(ocrDocData, (field) => {
    if (field.type === 'count') return 0;
    if (field.type === 'creationTime') return new Date();
    if (field.type === 'image') return field.value;
    if (field.type === 'owner') return { ...field.value.user, id: field.value.id };
    if (field.type === 'ref') return { ...field.value.doc, id: field.value.id };
    if (field.type === 'string') return field.value;
    assertNever(field);
  });
}
