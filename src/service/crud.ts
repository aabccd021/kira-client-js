import { Dictionary, FieldOf, Schema } from 'kira-core';

import { getDoc, setDoc } from '../cache';
import { ocrToDocData } from '../doc-data/ocr-to-docdata';
import {
  AuthError,
  DbpGetNewDocId,
  DbpReadDoc,
  DbpSetDoc,
  DocKey,
  DocState,
  Either,
  OCDocData,
  OCRDocField,
  OcToOcrDocField,
} from '../types';

export async function readDoc<S extends Schema, E>(args: {
  readonly dbpGetNewDocId: DbpGetNewDocId<E>;
  readonly dbpReadDoc: DbpReadDoc<E>;
  readonly dbpSetDoc: DbpSetDoc<E>;
  readonly key: DocKey;
  readonly ocToOcrDocField: OcToOcrDocField<S, E>;
  readonly schema: S;
}): Promise<void> {
  const { dbpGetNewDocId, dbpReadDoc, dbpSetDoc, key, ocToOcrDocField, schema } = args;

  const cached = getDoc<E>(key);
  if (cached) return;

  const remoteDoc = await dbpReadDoc(key);
  if (remoteDoc._tag === 'left') {
    setDoc(key, {
      state: 'error',
      error: remoteDoc.error,
      refresh: () => readDoc(args),
    });
    return;
  }

  const newCached: DocState<E> =
    remoteDoc.value.state === 'notExists'
      ? {
          state: 'notExists',
          create: (ocDocData) => {
            setDoc(key, {
              state: 'creating',
              refresh: () => readDoc(args),
            });
            createDoc({
              colName: key.collection,
              id: key.id,
              ocDocData,
              dbpSetDoc,
              dbpGetNewDocId,
              ocToOcrDocField,
              schema,
            });
          },
        }
      : {
          state: 'exists',
          doc: {
            ...remoteDoc.value.data,
            collection: key.collection,
            id: key.id,
          },
        };

  setDoc(key, newCached);
}

// TODO: add to list on create doc
export async function createDoc<S extends Schema, E>({
  colName,
  dbpGetNewDocId,
  dbpSetDoc,
  id: givenId,
  ocDocData,
  ocToOcrDocField,
  schema,
}: {
  readonly colName: string;
  readonly dbpGetNewDocId: DbpGetNewDocId<E>;
  readonly dbpSetDoc: DbpSetDoc<E>;
  readonly id?: string;
  readonly ocDocData: OCDocData;
  readonly ocToOcrDocField: OcToOcrDocField<S, E>;
  readonly schema: S;
}): Promise<Either<DocKey, E | AuthError>> {
  const colFields = schema.cols[colName] as Dictionary<FieldOf<S>> | undefined;
  if (colFields === undefined) {
    throw Error(`Unknown collection ${colName}`);
  }

  const id: Either<string, E | AuthError> = givenId
    ? { _tag: 'right', value: givenId }
    : await dbpGetNewDocId({ colName });

  if (id._tag === 'left') {
    return id;
  }

  const ocrDocData = await Promise.all(
    Object.entries(colFields).map(async ([fieldName, field]) => {
      const fieldValue = ocDocData[fieldName];

      if (field === undefined) {
        throw Error(`unknown field ${JSON.stringify(field)}`);
      }

      const result = await ocToOcrDocField({
        field,
        fieldName,
        fieldValue,
        colName,
        id: id.value,
      });

      return [fieldName, result] as readonly [string, Either<OCRDocField, E | AuthError>];
    })
  ).then((entries) =>
    entries.reduce<Either<Dictionary<OCRDocField>, E | AuthError>>(
      (acc, [key, dictValue]) => {
        if (acc._tag === 'left') {
          return acc;
        }

        if (dictValue._tag === 'left') {
          return dictValue;
        }

        return {
          _tag: 'right',
          value: {
            ...acc.value,
            [key]: dictValue.value,
          },
        };
      },
      { _tag: 'right', value: {} }
    )
  );

  if (ocrDocData._tag === 'left') return ocrDocData;

  const key: DocKey = {
    collection: colName,
    id: id.value,
  };

  setDoc(key, {
    state: 'exists',
    doc: {
      ...ocrToDocData(ocrDocData.value),
      ...key,
    },
  });

  dbpSetDoc(key, ocrDocData.value);

  return { _tag: 'right', value: key };
}
