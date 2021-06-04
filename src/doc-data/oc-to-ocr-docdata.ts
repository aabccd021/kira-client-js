import assertNever from 'assert-never';
import {
  CountField,
  CreationTimeField,
  Dictionary,
  FieldOf,
  ImageField,
  OwnerField,
  RefField,
  Schema,
  Schema_1,
  Schema_3,
  StringField,
} from 'kira-core';

import { getAuth, getDoc } from '../cache';
import {
  AuthError,
  Either,
  OCDocData,
  OCRCountField,
  OCRCreationTimeField,
  OCRDocData,
  OCRDocField,
  OCRImageField,
  OCROwnerField,
  OCRReferenceField as OCRRefField,
  OCRStringField,
  OcToOcrDocField,
  SpUploadFile,
} from '../types';
import { eProps, mapValues, ppProps } from '../util';

type OcToOcrDocFieldContext_1<E> = {
  readonly id: string;
  readonly fieldName: string;
  readonly fieldValue: unknown;
  readonly colName: string;
  readonly spUploadFile: SpUploadFile<E>;
};

type ToOCRDocFieldContext_3 = {
  readonly id: string;
  readonly fieldName: string;
  readonly fieldValue: unknown;
  readonly colName: string;
};

async function ocToOcrCountField(
  field: CountField,
  _: ToOCRDocFieldContext_3
): Promise<Either<OCRCountField, never>> {
  return { _tag: 'right', value: field };
}

async function ocToOcrCreationTimeField(
  field: CreationTimeField,

  _: ToOCRDocFieldContext_3
): Promise<Either<OCRCreationTimeField, never>> {
  return { _tag: 'right', value: field };
}

async function ocToOcrImageField<E>(
  _: ImageField,
  { fieldName, fieldValue, spUploadFile, id, colName }: OcToOcrDocFieldContext_1<E>
): Promise<Either<OCRImageField, E>> {
  const url = (fieldValue as { readonly url: string }).url;
  if (typeof url === 'string') {
    return {
      _tag: 'right',
      value: {
        type: 'image',
        value: { url },
      },
    };
  }

  const file = (fieldValue as { readonly file: File }).file;

  const auth = getAuth();

  const uploadResult = await spUploadFile({
    id,
    colName,
    fieldName,
    file,
    auth:
      auth?.state === 'signedIn' || auth?.state === 'loadingUserData'
        ? { state: 'signedIn', id: auth.id }
        : { state: 'signedOut' },
  });

  if (uploadResult._tag === 'left') {
    return uploadResult;
  }

  const { downloadUrl } = uploadResult.value;
  return {
    _tag: 'right',
    value: {
      type: 'image',
      value: { url: downloadUrl },
    },
  };
}

async function ocToOcrOwnerField(
  field: OwnerField,
  _: ToOCRDocFieldContext_3
): Promise<Either<OCROwnerField, AuthError>> {
  const auth = getAuth();
  if (auth?.state !== 'signedIn') {
    return {
      _tag: 'left',
      error: { type: 'userNotSignedIn' },
    };
  }
  return {
    _tag: 'right',
    value: {
      type: 'owner',
      syncFields: field.syncFields,
      value: auth,
    },
  };
}

async function ocToOcrRefField<E>(
  field: RefField,
  { colName, fieldValue }: ToOCRDocFieldContext_3
): Promise<Either<OCRRefField, E>> {
  const { id } = fieldValue as { readonly id: unknown };
  if (typeof id !== 'string') {
    throw Error(`${colName}.id is not string: ${id}`);
  }
  // assuming referenced document always exists on local before this doc creation
  const cachedRefDocState = getDoc({ collection: field.refCol, id });
  if (cachedRefDocState?.state !== 'exists') {
    throw Error(`referenced document does not exists: ${{ colName: ``, id }}`);
  }

  return {
    _tag: 'right',
    value: {
      type: 'ref',
      refCol: field.refCol,
      syncFields: field.syncFields,
      value: { id, doc: cachedRefDocState.doc },
    },
  };
}

async function ocToOcrStringField<E>(
  _: StringField,
  { colName, fieldValue, fieldName }: ToOCRDocFieldContext_3
): Promise<Either<OCRStringField, E>> {
  if (typeof fieldValue !== 'string') {
    throw Error(`${colName}.${fieldName} is not string: ${fieldValue}`);
  }
  return {
    _tag: 'right',
    value: { type: 'string', value: fieldValue },
  };
}

export function makeOcToOcrDocField_1<E>({
  spUploadFile,
}: {
  readonly spUploadFile: SpUploadFile<E>;
}): OcToOcrDocField<Schema_1, E> {
  return ({ field, ..._context }) => {
    const context = { ..._context, spUploadFile };
    if (field.type === 'count') return ocToOcrCountField(field, context);
    if (field.type === 'creationTime') return ocToOcrCreationTimeField(field, context);
    if (field.type === 'image') return ocToOcrImageField(field, context);
    if (field.type === 'owner') return ocToOcrOwnerField(field, context);
    if (field.type === 'ref') return ocToOcrRefField(field, context);
    if (field.type === 'string') return ocToOcrStringField(field, context);
    assertNever(field);
  };
}

export function makeOcToOcrDocField_3<E>(): OcToOcrDocField<Schema_3, E> {
  return ({ field, ..._context }) => {
    const context = { ..._context };
    if (field.type === 'count') return ocToOcrCountField(field, context);
    if (field.type === 'creationTime') return ocToOcrCreationTimeField(field, context);
    if (field.type === 'owner') return ocToOcrOwnerField(field, context);
    if (field.type === 'ref') return ocToOcrRefField(field, context);
    if (field.type === 'string') return ocToOcrStringField(field, context);
    assertNever(field);
  };
}

export async function ocToOcrDocData<S extends Schema, E>({
  colName,
  colFields,
  ocDocData,
  id,
  ocToOcrDocField,
}: {
  readonly colName: string;
  readonly colFields: Dictionary<FieldOf<S>>;
  readonly ocDocData: OCDocData;
  readonly id: string;
  readonly ocToOcrDocField: OcToOcrDocField<S, E>;
}): Promise<Either<OCRDocData, E | AuthError>> {
  const processedFields = await ppProps(
    mapValues(colFields, async function (field, fieldName): Promise<
      Either<OCRDocField, E | AuthError>
    > {
      const fieldValue = ocDocData[fieldName];

      if (field === undefined) {
        throw Error(`unknown field ${JSON.stringify(field)}`);
      }

      return ocToOcrDocField({ field, fieldName, fieldValue, colName, id });
    })
  ).then(eProps);

  if (processedFields._tag === 'left') return processedFields;

  return { _tag: 'right', value: processedFields.value };
}
