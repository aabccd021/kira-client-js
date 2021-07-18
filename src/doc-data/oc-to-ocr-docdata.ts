// import { CountField, CreationTimeField, ImageField, RefField, StringField } from 'kira-nosql';

// import { getAuth, getDoc } from '../cache';
// import {
//   Either,
//   OCRCountField,
//   OCRCreationTimeField,
//   OCRImageField,
//   OCRReferenceField as OCRRefField,
//   OCRStringField,
//   SpUploadFile,
// } from '../types';

// type OcToOcrDocFieldContext_1<E> = {
//   readonly colName: string;
//   readonly fieldName: string;
//   readonly fieldValue: unknown;
//   readonly id: string;
//   readonly spUploadFile: SpUploadFile<E>;
// };

// type ToOCRDocFieldContext = {
//   readonly colName: string;
//   readonly fieldName: string;
//   readonly fieldValue: unknown;
//   readonly id: string;
// };

// export async function ocToOcrCountField(
//   field: CountField,
//   _: ToOCRDocFieldContext
// ): Promise<Either<OCRCountField, never>> {
//   return { tag: 'right', value: field };
// }

// export async function ocToOcrCreationTimeField(
//   field: CreationTimeField,
//   _: ToOCRDocFieldContext
// ): Promise<Either<OCRCreationTimeField, never>> {
//   return { tag: 'right', value: field };
// }

// export async function ocToOcrImageField<E>(
//   _: ImageField,
//   { fieldName, fieldValue, id, colName }: ToOCRDocFieldContext,
//   spUploadFile: SpUploadFile<E>
// ): Promise<Either<OCRImageField, E>> {
//   const url = (fieldValue as { readonly url: string }).url;
//   if (typeof url === 'string') {
//     return {
//       tag: 'right',
//       value: {
//         type: 'image',
//         value: { url },
//       },
//     };
//   }

//   const file = (fieldValue as { readonly file: File }).file;

//   const auth = getAuth();

//   const uploadResult = await spUploadFile({
//     id,
//     colName,
//     fieldName,
//     file,
//     auth:
//       auth?.state === 'signedIn' || auth?.state === 'loadingUserData'
//         ? { state: 'signedIn', id: auth.id }
//         : { state: 'signedOut' },
//   });

//   if (uploadResult.tag === 'left') {
//     return uploadResult;
//   }

//   const { downloadUrl } = uploadResult.value;
//   return {
//     tag: 'right',
//     value: {
//       type: 'image',
//       value: { url: downloadUrl },
//     },
//   };
// }

// async function ocToOcrOwnerField(
//   field: OwnerField,
//   _: ToOCRDocFieldContext_3
// ): Promise<Either<OCROwnerField, AuthError>> {
//   const auth = getAuth();
//   if (auth?.state !== 'signedIn') {
//     return {
//       tag: 'left',
//       error: { type: 'userNotSignedIn' },
//     };
//   }
//   return {
//     tag: 'right',
//     value: {
//       type: 'owner',
//       syncFields: field.syncFields,
//       value: auth,
//     },
//   };
// }

// export async function ocToOcrRefField<E>(
//   field: RefField,
//   { colName, fieldValue }: ToOCRDocFieldContext
// ): Promise<Either<OCRRefField, E>> {
//   const { id } = fieldValue as { readonly id: unknown };
//   if (typeof id !== 'string') {
//     throw Error(`${colName}.id is not string: ${id}`);
//   }
//   // assuming referenced document always exists on local before this doc creation
//   const cachedRefDocState = getDoc({ collection: field.refedCol, id });
//   if (cachedRefDocState?.state !== 'exists') {
//     throw Error(`referenced document does not exists: ${{ colName: ``, id }}`);
//   }

//   return {
//     tag: 'right',
//     value: {
//       type: 'ref',
//       refCol: field.refCol,
//       syncFields: field.syncFields,
//       value: { id, doc: cachedRefDocState.doc },
//     },
//   };
// }

// export async function ocToOcrStringField<E>(
//   _: StringField,
//   { colName, fieldValue, fieldName }: ToOCRDocFieldContext
// ): Promise<Either<OCRStringField, E>> {
//   if (typeof fieldValue !== 'string') {
//     throw Error(`${colName}.${fieldName} is not string: ${fieldValue}`);
//   }
//   return {
//     tag: 'right',
//     value: { type: 'string', value: fieldValue },
//   };
// }
