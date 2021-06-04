import { Dictionary, FieldOf, Schema } from 'kira-core';

import { getDoc, setDoc } from '../cache';
import { ocToOcrDocData } from '../doc-data/oc-to-ocr-docdata';
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
  OcToOcrDocField,
} from '../types';

export async function readDoc<S extends Schema, E>(args: {
  readonly key: DocKey;
  readonly dbpReadDoc: DbpReadDoc<E>;
  readonly dbpSetDoc: DbpSetDoc<E>;
  readonly dbpGetNewDocId: DbpGetNewDocId<E>;
  readonly ocToOcrDocField: OcToOcrDocField<S, E>;
  readonly schema: S;
}): Promise<void> {
  const { key, dbpReadDoc, dbpSetDoc, dbpGetNewDocId, ocToOcrDocField, schema } = args;

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

// export async function createDoc_3<DBE, SE>({
//   colName,
//   id,
//   ocDocData,
//   schema,
//   dbpSetDoc,
//   dbpGetNewDocId,
// }: {
//   readonly colName: string;
//   readonly id?: string;
//   readonly ocDocData: OCDocData;
//   readonly schema: Schema_3;
//   readonly dbpSetDoc: DbpSetDoc<DBE>;
//   readonly dbpGetNewDocId: DbpGetNewDocId<DBE>;
//   readonly spUploadFile: SpUploadFile<SE>;
// }): Promise<Either<DocKey, CreateDocError<DBE, SE>>> {
// }

// TODO: add to list on create doc
export async function createDoc<S extends Schema, E>({
  colName,
  dbpGetNewDocId,
  dbpSetDoc,
  ocToOcrDocField,
  id,
  ocDocData,
  schema,
}: {
  readonly colName: string;
  readonly dbpGetNewDocId: DbpGetNewDocId<E>;
  readonly dbpSetDoc: DbpSetDoc<E>;
  readonly ocToOcrDocField: OcToOcrDocField<S, E>;
  readonly id?: string;
  readonly ocDocData: OCDocData;
  readonly schema: S;
}): Promise<Either<DocKey, E | AuthError>> {
  const colFields = schema.cols[colName] as Dictionary<FieldOf<S>> | undefined;
  if (colFields === undefined) {
    throw Error(`Unknown collection ${colName}`);
  }
  const finalId: Either<string, E | AuthError> = id
    ? { _tag: 'right', value: id }
    : await dbpGetNewDocId({ colName });

  if (finalId._tag === 'left') return finalId;

  const processedDocData = await ocToOcrDocData<S, E | AuthError>({
    ocToOcrDocField: ocToOcrDocField,
    colFields,
    colName,
    ocDocData,
    id: finalId.value,
  });

  if (processedDocData._tag === 'left') return processedDocData;

  const ocrDocData = processedDocData.value;
  const key: DocKey = { collection: colName, id: finalId.value };
  const docData = ocrToDocData(ocrDocData);

  setDoc(key, {
    state: 'exists',
    doc: { ...docData, ...key },
  });
  dbpSetDoc(key, ocrDocData);

  return { _tag: 'right', value: key };
}
