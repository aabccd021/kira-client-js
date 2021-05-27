import { Schema_1 } from 'kira-core';

import { getDoc, setDoc } from '../cache';
import { ocToOcrDocData_1 } from '../doc-data/oc-to-ocr-docdata';
import { ocrToDocData } from '../doc-data/ocr-to-docdata';
import {
  CreateDocError,
  DbpGetNewDocId,
  DbpReadDoc,
  DbpSetDoc,
  DocKey,
  DocState,
  Either,
  OCDocData,
  SpUploadFile,
} from '../types';

export async function readDoc<DBE, SE>(args: {
  readonly key: DocKey;
  readonly schema: Schema_1;
  readonly dbpReadDoc: DbpReadDoc<DBE>;
  readonly dbpSetDoc: DbpSetDoc<DBE>;
  readonly dbpGetNewDocId: DbpGetNewDocId<DBE>;
  readonly spUploadFile: SpUploadFile<SE>;
}): Promise<void> {
  const { key, schema, dbpReadDoc, dbpSetDoc, dbpGetNewDocId, spUploadFile } = args;

  const cached = getDoc<DBE>(key);
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

  const newCached: DocState<DBE> =
    remoteDoc.value.state === 'notExists'
      ? {
          state: 'notExists',
          create: (ocDocData) => {
            setDoc(key, {
              state: 'creating',
              refresh: () => readDoc(args),
            });
            createDoc_1({
              colName: key.collection,
              id: key.id,
              ocDocData,
              schema,
              dbpSetDoc,
              dbpGetNewDocId,
              spUploadFile,
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
export async function createDoc_1<DBE, SE>({
  colName,
  id,
  ocDocData,
  schema,
  dbpSetDoc,
  dbpGetNewDocId,
  spUploadFile,
}: {
  readonly colName: string;
  readonly id?: string;
  readonly ocDocData: OCDocData;
  readonly schema: Schema_1;
  readonly dbpSetDoc: DbpSetDoc<DBE>;
  readonly dbpGetNewDocId: DbpGetNewDocId<DBE>;
  readonly spUploadFile: SpUploadFile<SE>;
}): Promise<Either<DocKey, CreateDocError<DBE, SE>>> {
  const colFields = schema.cols[colName];
  if (colFields === undefined) {
    throw Error(`Unknown collection ${colName}`);
  }
  const finalId: Either<string, DBE> = id
    ? { _tag: 'right', value: id }
    : await dbpGetNewDocId({ colName });

  if (finalId._tag === 'left') {
    return {
      _tag: 'left',
      error: { type: 'db', error: finalId.error },
    };
  }

  const processedDocData = await ocToOcrDocData_1<DBE, SE>({
    colFields,
    colName,
    spUploadFile,
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
