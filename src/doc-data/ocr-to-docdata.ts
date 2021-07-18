// import assertNever from 'assert-never';

// import { DocData, DocField, OCRDocData, OCRDocField } from '../types';

// export function ocrToDocData(ocrDocData: OCRDocData): DocData {
//   return Object.entries(ocrDocData).reduce(
//     (acc, [fieldName, field]) => ({ ...acc, [fieldName]: ocrToDocField(field) }),
//     {}
//   );
// }

// function ocrToDocField(field: OCRDocField): DocField {
//   if (field.type === 'count') return 0;
//   if (field.type === 'creationTime') return new Date();
//   if (field.type === 'image') return field.value;
//   if (field.type === 'owner') return { ...field.value.user, id: field.value.id };
//   if (field.type === 'ref') return { ...field.value.doc, id: field.value.id };
//   if (field.type === 'string') return field.value;
//   assertNever(field);
// }
