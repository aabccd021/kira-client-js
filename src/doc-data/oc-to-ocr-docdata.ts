import assertNever from 'assert-never';
import {
  CountField,
  CreationTimeField,
  Dictionary,
  Field_1,
  ImageField,
  OwnerField,
  RefField,
  StringField,
} from 'kira-core';

import { getAuth, getDoc } from '../cache';
import {
  CreateDocError,
  Either,
  OCDocData,
  OCRCountField,
  OCRCreationTimeField,
  OCRDocData,
  OCRDocDataField,
  OCRImageField,
  OCROwnerField,
  OCRReferenceField,
  OCRStringField,
  SpUploadFile,
} from '../types';
import { eProps, mapValues, ppProps } from '../util';

type HandleFieldContext<SE> = {
  readonly id: string;
  readonly fieldName: string;
  readonly fieldValue: unknown;
  readonly colName: string;
  readonly spUploadFile: SpUploadFile<SE>;
};

function handleCountField(field: CountField): Either<OCRCountField, never> {
  return { _tag: 'right', value: field };
}

function handleCreationTimeField(field: CreationTimeField): Either<OCRCreationTimeField, never> {
  return { _tag: 'right', value: field };
}

async function handleImageField<DBE, SE>(
  _: ImageField,
  { fieldName, fieldValue, spUploadFile, id, colName }: HandleFieldContext<SE>
): Promise<Either<OCRImageField, CreateDocError<DBE, SE>>> {
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
    return {
      _tag: 'left',
      error: { type: 'storage', error: uploadResult.error },
    };
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

function handleOwnerField<DBE, SE>(
  field: OwnerField
): Either<OCROwnerField, CreateDocError<DBE, SE>> {
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

async function handleReferenceField<DBE, SE>(
  field: RefField,
  { colName, fieldValue }: HandleFieldContext<SE>
): Promise<Either<OCRReferenceField, CreateDocError<DBE, SE>>> {
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

function handleStringField<DBE, SE>(
  _: StringField,
  { colName, fieldValue, fieldName }: HandleFieldContext<SE>
): Either<OCRStringField, CreateDocError<DBE, SE>> {
  if (typeof fieldValue !== 'string') {
    throw Error(`${colName}.${fieldName} is not string: ${fieldValue}`);
  }
  return {
    _tag: 'right',
    value: { type: 'string', value: fieldValue },
  };
}

export async function ocToOcrDocData<DBE, SE>({
  colName,
  colFields,
  ocDocData,
  id,
  spUploadFile,
}: {
  readonly colName: string;
  readonly colFields: Dictionary<Field_1>;
  readonly ocDocData: OCDocData;
  readonly id: string;
  readonly spUploadFile: SpUploadFile<SE>;
}): Promise<Either<OCRDocData, CreateDocError<DBE, SE>>> {
  const processedFields = await ppProps(
    mapValues(colFields, async function (field, fieldName): Promise<
      Either<OCRDocDataField, CreateDocError<DBE, SE>>
    > {
      const fieldValue = ocDocData[fieldName];
      if (field === undefined) {
        throw Error(`unknown field ${JSON.stringify(field)}`);
      }
      const context: HandleFieldContext<SE> = {
        fieldName,
        spUploadFile,
        id,
        fieldValue,
        colName,
      };
      if (field.type === 'count') return handleCountField(field);
      if (field.type === 'creationTime') return handleCreationTimeField(field);
      if (field.type === 'image') return handleImageField(field, context);
      if (field.type === 'owner') return handleOwnerField(field);
      if (field.type === 'ref') return handleReferenceField(field, context);
      if (field.type === 'string') return handleStringField(field, context);
      assertNever(field);
    })
  ).then(eProps);

  if (processedFields._tag === 'left') return processedFields;

  return { _tag: 'right', value: processedFields.value };
}
