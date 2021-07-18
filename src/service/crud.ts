import { Dictionary, DocKey, Either } from 'kira-nosql';

import { getDoc, setDoc } from '../cache';
import {
  CreateDocError,
  OcField,
  OcToDoc,
  OcToDocError,
  PGetNewDocId,
  PGetNewDocIdError,
  PReadDoc,
  PReadDocError,
  PSetDoc,
  PSetDocError,
} from '../types';

export async function readDoc(args: {
  readonly provider: {
    readonly getNewDocId: PGetNewDocId;
    readonly readDoc: PReadDoc;
    readonly setDoc: PSetDoc;
  };
  readonly key: DocKey;
  readonly ocToDoc: OcToDoc;
}): Promise<Either<undefined, PReadDocError>> {
  const { provider, key, ocToDoc } = args;

  const cached = getDoc(key);
  if (cached) return { tag: 'right', value: undefined };

  const remoteDoc = await provider.readDoc(key);
  if (remoteDoc.tag === 'left') {
    setDoc({
      key,
      doc: {
        state: 'error',
        error: remoteDoc.error,
        refresh: () => readDoc(args),
      },
    });
    return remoteDoc;
  }

  setDoc({
    key,
    doc:
      remoteDoc.value.state === 'notExists'
        ? {
            state: 'notExists',
            create: (ocDoc) => {
              setDoc({
                key,
                doc: { state: 'creating', refresh: () => readDoc(args) },
              });
              createDoc({
                colName: key.col,
                id: key.id,
                ocDoc,
                ocToDoc,
                provider,
              });
            },
          }
        : { state: 'exists', id: key.id, data: remoteDoc.value.data },
  });

  return { tag: 'right', value: undefined };
}

// TODO: add to list on create doc
export async function createDoc({
  colName,
  provider,
  id: givenId,
  ocDoc,
  ocToDoc,
}: {
  readonly colName: string;
  readonly provider: {
    readonly getNewDocId: PGetNewDocId;
    readonly setDoc: PSetDoc;
  };
  readonly id?: string;
  readonly ocDoc: Dictionary<OcField>;
  readonly ocToDoc: OcToDoc;
}): Promise<Either<DocKey, CreateDocError>> {
  const id: Either<string, PGetNewDocIdError> = givenId
    ? { tag: 'right', value: givenId }
    : await provider.getNewDocId({ colName });

  if (id.tag === 'left') {
    return id;
  }

  const doc = await ocToDoc(ocDoc);

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
