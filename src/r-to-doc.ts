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

import { RField, RToDoc, RToDocErr, RToDocUnknownCollectionNameErr, RToField } from './type';

export function buildRToDoc(spec: Spec, rToField: RToField): RToDoc {
  return (col, rDoc) =>
    optionFold(
      optionFromNullable(spec[col]),
      () => Left(RToDocUnknownCollectionNameErr({ col })) as Either<RToDocErr, Option<Doc>>,
      (colSpec) =>
        eitherArrayReduce(
          Object.entries(colSpec).filter(([fieldName]) => fieldName[0] !== '_'),
          Right(None()) as Either<RToDocErr, Option<Doc>>,
          (acc, [fieldName, fieldSpec]) =>
            eitherMapRight(
              rToField({
                ctx: { col, field: optionFromNullable<RField>(rDoc[fieldName]), fieldName },
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
