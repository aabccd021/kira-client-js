import { DocToR } from './type';

export const docToR: DocToR = (doc) =>
  Object.fromEntries(
    Object.entries(doc).map(([fieldName, field]) => {
      if (field._type === 'String') {
        return [fieldName, field.value];
      }

      if (field._type === 'Date') {
        return [fieldName, field.value];
      }

      if (field._type === 'Image') {
        return [fieldName, field.value];
      }

      if (field._type === 'Number') {
        return [fieldName, field.value];
      }

      //if (field._type === 'Ref')
      return [fieldName, docToR(field.snapshot.doc)];
    })
  );
