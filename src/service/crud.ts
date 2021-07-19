import { Doc, DocKey, Either, Field } from 'kira-nosql';

import { getDoc, setDoc } from '../cache';
import {
  CreateDocError,
  DocState,
  OcDoc,
  OcToField,
  OcToFieldError,
  PGetNewDocId,
  PGetNewDocIdError,
  PReadDoc,
  PReadDocError,
  PSetDoc,
} from '../types';

export async function readDoc(args: {
  readonly provider: {
    readonly getNewDocId: PGetNewDocId;
    readonly readDoc: PReadDoc;
    readonly setDoc: PSetDoc;
  };
  readonly key: DocKey;
  readonly ocToField: OcToField;
}): Promise<Either<DocState, PReadDocError>> {
  const { provider, key, ocToField } = args;

  const cached = getDoc(key);
  if (cached) {
    return { tag: 'right', value: cached };
  }

  const refresh = () => readDoc(args);

  const remoteDoc = await provider.readDoc(key);
  if (remoteDoc.tag === 'left') {
    setDoc({
      key,
      doc: {
        state: 'error',
        error: remoteDoc.error,
        refresh,
      },
    });
    return remoteDoc;
  }

  const doc: DocState =
    remoteDoc.value.state === 'notExists'
      ? {
          state: 'notExists',
          create: (ocDoc) => {
            setDoc({
              key,
              doc: { state: 'creating', refresh },
            });
            createDoc({
              colName: key.col,
              id: key.id,
              ocDoc,
              ocToField,
              provider,
            });
          },
        }
      : {
          state: 'exists',
          id: key.id,
          data: remoteDoc.value.data,
        };

  setDoc({ key, doc });

  return { tag: 'right', value: doc };
}

// TODO: add to list on create doc
export async function createDoc({
  colName,
  id: givenId,
  ocDoc,
  ocToField,
  provider,
}: {
  readonly colName: string;
  readonly id?: string;
  readonly ocDoc: OcDoc;
  readonly ocToField: OcToField;
  readonly provider: {
    readonly getNewDocId: PGetNewDocId;
    readonly setDoc: PSetDoc;
  };
}): Promise<Either<DocKey, CreateDocError>> {
  const id: Either<string, PGetNewDocIdError> = givenId
    ? { tag: 'right', value: givenId }
    : await provider.getNewDocId({ colName });

  if (id.tag === 'left') {
    return id;
  }

  const doc = await Promise.all(
    Object.entries(ocDoc).map<
      Promise<{ readonly fieldName: string; readonly field: Either<Field, OcToFieldError> }>
    >(([fieldName, ocField]) =>
      ocToField({ ocField, context: { fieldName, colName, id: id.value } }).then((field) => ({
        fieldName,
        field,
      }))
    )
  ).then((doc) =>
    doc.reduce<Either<Doc, OcToFieldError>>(
      (acc, { fieldName, field }) => {
        if (acc.tag === 'left') return acc;
        if (field.tag === 'left') return field;
        return {
          tag: 'right',
          value: {
            ...acc.value,
            [fieldName]: field.value,
          },
        };
      },
      { tag: 'right', value: {} }
    )
  );

  if (doc.tag === 'left') return doc;

  const key: DocKey = { col: colName, id: id.value };

  setDoc({
    key,
    doc: { state: 'exists', id: id.value, data: doc.value },
  });

  const pSetDocResult = await provider.setDoc({ key, data: doc.value });

  if (pSetDocResult.tag === 'left') {
    return pSetDocResult;
  }

  return { tag: 'right', value: key };
}
