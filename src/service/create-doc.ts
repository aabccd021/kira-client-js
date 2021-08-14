import { Doc, DocKey, Spec } from 'kira-core';
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
  DocToR,
  PGetNewDocId,
  PGetNewDocIdError,
  PSetDoc,
  PSetDocError,
  ReadyDocState,
  SetDocState,
  UnknownCollectionNameError,
} from '../type';

export function buildCreateDoc<
  CFTE extends CToFieldError,
  PSDE extends PSetDocError,
  PGNDI extends PGetNewDocIdError
>({
  cToField,
  docToR,
  provider,
  spec,
  setDocState,
}: {
  readonly cToField: CToField<CFTE>;
  readonly docToR: DocToR;
  readonly provider: {
    readonly getNewDocId: PGetNewDocId<PGNDI>;
    readonly setDoc: PSetDoc<PSDE>;
  };
  readonly setDocState: SetDocState;
  readonly spec: Spec;
}): CreateDoc<CFTE, PSDE, PGNDI> {
  return ({ cDoc, col, id: givenId }) =>
    optionFold(
      optionFromNullable(spec[col]),
      () => Promise.resolve(Left(UnknownCollectionNameError({ col }))),
      (colSpec) =>
        optionFold(
          givenId,
          () => provider.getNewDocId({ col }),
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
                    (left) => Promise.resolve(Left(left)),
                    (doc) => {
                      const key: DocKey = { col, id };
                      setDocState(key, ReadyDocState({ data: docToR(doc), id }));
                      return provider.setDoc({ data: doc, key, spec }).then((result) =>
                        eitherFold(
                          result,
                          (left) => Left(left) as Either<PSDE, CreateDocResult>,
                          () => Right({ doc, id })
                        )
                      );
                    }
                  )
                )
          )
        )
    );
}
