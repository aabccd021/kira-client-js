import { Doc, Spec } from 'kira-core';
import {
  Either,
  eitherFold,
  eitherMapRight,
  Left,
  optionFold,
  optionFromNullable,
  Right,
} from 'trimop';

import {
  CField,
  CreateDoc,
  CreateDocResult,
  CToField,
  CToFieldError,
  PGetNewDocId,
  PGetNewDocIdError,
  PSetDoc,
  PSetDocError,
  UnknownCollectionNameError,
} from '../type';

export function buildCreateDoc<
  CFTE extends CToFieldError,
  PSDE extends PSetDocError,
  PGNDI extends PGetNewDocIdError
>({
  cToField,
  spec,
  pGetNewDocId,
  pSetDoc,
}: {
  readonly cToField: CToField<CFTE>;
  readonly pGetNewDocId: PGetNewDocId<PGNDI>;
  readonly pSetDoc: PSetDoc<PSDE>;
  readonly spec: Spec;
}): CreateDoc<CFTE, PSDE, PGNDI> {
  return ({ cDoc, col, id: givenId }) =>
    optionFold(
      optionFromNullable(spec[col]),
      () => Promise.resolve(Left(UnknownCollectionNameError({ col }))),
      (colSpec) =>
        optionFold(
          givenId,
          () => pGetNewDocId({ col }),
          (id) => Promise.resolve(Right(id))
        ).then((id) =>
          eitherFold(
            id,
            (left) => Promise.resolve(Left(left)),
            (id) =>
              Promise.all(
                Object.entries(colSpec).map(([fieldName, fieldSpec]) =>
                  cToField({
                    context: {
                      col,
                      field: optionFromNullable<CField>(cDoc[fieldName]),
                      fieldName,
                      id,
                    },
                    fieldSpec,
                  }).then((field) => ({ field, fieldName }))
                )
              )
                .then((doc) =>
                  doc.reduce<Either<CFTE, Doc>>(
                    (acc, { fieldName, field }) =>
                      eitherMapRight(acc, (acc) =>
                        eitherMapRight(field, (field) =>
                          optionFold(
                            field,
                            () => Right(acc),
                            (field) =>
                              Right({
                                ...acc,
                                [fieldName]: field,
                              })
                          )
                        )
                      ),
                    Right({})
                  )
                )
                .then((doc) =>
                  eitherFold(
                    doc,
                    async (left) => Left(left),
                    (doc) =>
                      pSetDoc({ doc, key: { col, id }, spec }).then((result) =>
                        eitherFold(
                          result,
                          (left) => Left(left) as Either<PSDE, CreateDocResult>,
                          () => Right({ doc, id })
                        )
                      )
                  )
                )
          )
        )
    );
}
