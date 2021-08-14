import { Field } from 'kira-core';
import { Either, None, Option, optionFold, Right } from 'trimop';

import { cToImageField } from '../src/c-to-field/image';
import { cToRefField } from '../src/c-to-field/ref';
import { cToStringField } from '../src/c-to-field/string';
import { CToField, CToFieldError, GetAuthState, PUploadImage, RToDoc } from '../src/type';

const getAuthState: GetAuthState;

const pUploadImage: PUploadImage;

const rToDoc: RToDoc;

const cToField: CToField = ({ context, fieldSpec, field }) => {
  return optionFold(
    field,
    async () => Right(None()) as Either<CToFieldError, Option<Field>>,
    async (field) => {
      if (fieldSpec._type === 'Image') {
        return cToImageField({ context, field, fieldSpec, getAuthState, pUploadImage });
      }
      if (fieldSpec._type === 'String') {
        return cToStringField({ context, field, fieldSpec });
      }
      if (fieldSpec._type === 'Ref') {
        return cToRefField({ context, field, fieldSpec, getAuthState, rToDoc });
      }
      return Right(None());
    }
  );
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
