import { Either, ImageField } from 'kira-nosql';

import { getAuth } from '../cache';
import { ImageOcField, OcToFieldContext, OcToFieldError, PUploadFile } from '../types';

export async function ocToOcrImageField({
  field,
  context: { fieldName, id, colName },
  provider,
}: {
  readonly field: ImageOcField;
  readonly context: OcToFieldContext;
  readonly provider: {
    readonly uploadFile: PUploadFile;
  };
}): Promise<Either<ImageField, OcToFieldError>> {
  if (field.source.type === 'url') {
    return {
      tag: 'right',
      value: {
        type: 'image',
        value: { url: field.source.url },
      },
    };
  }

  const auth = getAuth();

  const uploadResult = await provider.uploadFile({
    id,
    colName,
    fieldName,
    file: field.source.file,
    auth:
      auth?.state === 'signedIn' || auth?.state === 'loadingUserData'
        ? { state: 'signedIn', id: auth.id }
        : { state: 'signedOut' },
  });

  if (uploadResult.tag === 'left') {
    return uploadResult;
  }

  const { downloadUrl } = uploadResult.value;
  return {
    tag: 'right',
    value: {
      type: 'image',
      value: { url: downloadUrl },
    },
  };
}
