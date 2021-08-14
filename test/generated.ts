/* eslint-disable no-use-before-define */
import { Spec } from 'kira-core';
import { Left } from 'trimop';

import {
  buildRToDoc,
  cToCountField,
  cToCreationTimeField,
  CToField,
  CToFieldNeverError,
  cToImageField,
  cToRefField,
  cToStringField,
  getAuthState,
  PUploadImage,
  PUploadImageError,
  rToCountField,
  rToCreationTimeField,
  RToField,
  RToFieldNeverError,
  rToImageField,
  rToRefField,
  rToStringField,
} from '../src';

const pUploadImage: PUploadImage<PUploadImageError> = jest.fn();

const spec: Spec = {};

const rToField: RToField = ({ context, fieldSpec }) => {
  if (fieldSpec._type === 'Image') {
    return rToImageField({ context, fieldSpec });
  }
  if (fieldSpec._type === 'String') {
    return rToStringField({ context, fieldSpec });
  }
  if (fieldSpec._type === 'Ref') {
    return rToRefField({ context, fieldSpec, rToDoc });
  }
  if (fieldSpec._type === 'Count') {
    return rToCountField({ context, fieldSpec });
  }
  if (fieldSpec._type === 'CreationTime') {
    return rToCreationTimeField({ context, fieldSpec });
  }
  return Left(RToFieldNeverError(fieldSpec));
};

const rToDoc = buildRToDoc(spec, rToField);

const cToField: CToField = async ({ context, fieldSpec }) => {
  if (fieldSpec._type === 'Image') {
    return cToImageField({ context, fieldSpec, getAuthState, pUploadImage });
  }
  if (fieldSpec._type === 'String') {
    return cToStringField({ context, fieldSpec });
  }
  if (fieldSpec._type === 'Ref') {
    return cToRefField({ context, fieldSpec, getAuthState, rToDoc });
  }
  if (fieldSpec._type === 'Count') {
    return cToCountField({ context, fieldSpec });
  }
  if (fieldSpec._type === 'CreationTime') {
    return cToCreationTimeField({ context, fieldSpec });
  }
  return Left(CToFieldNeverError(fieldSpec));
};

// const docToR: DocToR;
// const provider: {
//   getNewDocId: PGetNewDocId<PGNDI>;
//   setDoc: PSetDoc<PSDE>;
// };
// const setDocState: SetDocState;
// const spec: Spec;

// const createDoc = buildCreateDoc({});

// const initialFetchDoc = buildInitialFetchDoc({});
