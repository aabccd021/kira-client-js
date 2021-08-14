import { Doc, Spec } from 'kira-core';
import { eitherMapRight, Some } from 'kira-core/node_modules/trimop';
import {
  Either,
  eitherArrayReduce,
  Left,
  None,
  Option,
  optionFold,
  optionFromNullable,
  Right,
} from 'trimop';

import { RField, RToDoc, RToDocError, RToDocUnknownCollectionNameError, RToField } from './type';

// Object.fromEntries(
//   Object.entries(doc)
//     .filter(([fieldName]) => fieldName[0] !== '_')
//     .map(([fieldName, field]) => {
//       if (typeof field === 'string') {
//         return [fieldName, StringField(field)];
//       }
//       if (typeof field === 'number') {
//         return [fieldName, NumberField(field)];
//       }
//       if (field instanceof Date) {
//         return [fieldName, DateField(field)];
//       }
//       if (isImageFieldValue(field)) {
//         return [fieldName, ImageField(field)];
//       }
//       // eslint-disable-next-line unused-imports/no-unused-vars
//       return [fieldName, RefField({ doc: rToDoc(field), id: field._id })];
//     })
// );

export function buildRToDoc(spec: Spec, rToField: RToField): RToDoc {
  return (col, rDoc) =>
    optionFold(
      optionFromNullable(spec[col]),
      () => Left(RToDocUnknownCollectionNameError({ col })) as Either<RToDocError, Option<Doc>>,
      (colSpec) =>
        eitherArrayReduce(
          Object.entries(colSpec).filter(([fieldName]) => fieldName[0] !== '_'),
          Right(None()) as Either<RToDocError, Option<Doc>>,
          (acc, [fieldName, fieldSpec]) =>
            eitherMapRight(
              rToField({
                context: { col, field: optionFromNullable<RField>(rDoc[fieldName]), fieldName },
                fieldSpec,
              }),
              (field) =>
                Right(
                  optionFold(
                    field,
                    () => acc,
                    (field) =>
                      Some(
                        optionFold(
                          acc,
                          () => ({ [fieldName]: field }),
                          (acc) => ({ ...acc, [fieldName]: field })
                        )
                      )
                  )
                )
            )
        )
    );
}
