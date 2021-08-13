import { Doc, DocKey, Spec } from 'kira-core';
import {
  Either,
  eitherFold,
  eitherMapRight,
  Left,
  Option,
  optionFold,
  optionFromNullable,
  Right,
} from 'trimop';

import {
  CDoc,
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
  UnknownCollectionNameFailure,
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
  readonly cDoc: CDoc;
  readonly cToField: CToField<CFTE>;
  readonly col: string;
  readonly docToR: DocToR;
  readonly id: Option<string>;
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
      () => Promise.resolve(Left(UnknownCollectionNameFailure({ col }))),
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
                Object.entries(colSpec).map(async ([fieldName, fieldSpec]) =>
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
                          Right({
                            ...acc,
                            [fieldName]: field,
                          })
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
