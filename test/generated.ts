/* eslint-disable no-use-before-define */
import { Spec } from 'kira-core';
import { Left } from 'trimop';

import { cToCountField, rToCountField } from '../src/field/count';
import { cToCreationTimeField, rToCreationTimeField } from '../src/field/creation-time';
import { cToImageField, rToImageField } from '../src/field/image';
import { cToRefField, rToRefField } from '../src/field/ref';
import { cToStringField, rToStringField } from '../src/field/string';
import { buildRToDoc } from '../src/r-to-doc';
import {
  CToField,
  CToFieldNeverError,
  GetAuthState,
  PUploadImage,
  PUploadImageError,
  RToField,
  RToFieldNeverError,
} from '../src/type';

const getAuthState: GetAuthState;

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
