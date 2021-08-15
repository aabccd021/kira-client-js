/* eslint-disable import/exports-last */
/* eslint-disable no-use-before-define */
import { Spec } from 'kira-core';
import { buildCountDraft, buildCreationTimeDraft, BuildDraft, buildRefDraft } from 'kira-nosql';
import { Left, None } from 'trimop';

import {
  buildCreateDoc,
  buildMakeDocState,
  buildRToDoc,
  buildSetDocState,
  cToCountField,
  cToCreationTimeField,
  CToField,
  CToFieldNeverError,
  cToImageField,
  cToRefField,
  cToStringField,
  docToR,
  getAuthState,
  ImageCField,
  ImageRField,
  PGetNewDocId,
  PGetNewDocIdError,
  PReadDoc,
  PReadDocError,
  PSetDoc,
  PSetDocError,
  PUploadImage,
  PUploadImageError,
  rToCountField,
  rToCreationTimeField,
  RToField,
  RToFieldNeverError,
  rToImageField,
  rToRefField,
  rToStringField,
  StringCField,
} from '../src';
import { buildInitialFetchDoc } from '../src/service/effect/initial-fetch-doc';

export const pGetNewDocId = jest.fn<
  ReturnType<PGetNewDocId<PGetNewDocIdError>>,
  Parameters<PGetNewDocId<PGetNewDocIdError>>
>();

export const pSetDoc = jest.fn<
  ReturnType<PSetDoc<PSetDocError>>,
  Parameters<PSetDoc<PSetDocError>>
>();

export const pUploadImage: PUploadImage<PUploadImageError> = jest.fn();
export const pReadDoc = jest.fn<
  ReturnType<PReadDoc<PReadDocError>>,
  Parameters<PReadDoc<PReadDocError>>
>();

const spec: Spec = {
  independent: {
    foo: { _type: 'String' },
  },
  meme: {
    creationTime: {
      _type: 'CreationTime',
    },
    memeImage: {
      _type: 'Ref',
      isOwner: false,
      refedCol: 'memeImage',
      syncedFields: {
        image: true,
      },
      thisColRefers: [],
    },
    owner: {
      _type: 'Ref',
      isOwner: true,
      refedCol: 'user',
      syncedFields: {
        displayName: true,
        profilePicture: true,
      },
      thisColRefers: [],
    },
    text: {
      _type: 'String',
    },
  },
  memeImage: {
    creationTime: {
      _type: 'CreationTime',
    },
    image: {
      _type: 'Image',
    },
    memeCreatedCount: {
      _type: 'Count',
      countedCol: 'meme',
      groupByRef: 'memeImage',
    },
    owner: {
      _type: 'Ref',
      isOwner: true,
      refedCol: 'user',
      syncedFields: {
        displayName: true,
        profilePicture: true,
      },
      thisColRefers: [
        {
          colName: 'meme',
          fields: [{ name: 'meme', syncedFields: {} }],
          thisColRefers: [],
        },
      ],
    },
  },
  user: {
    displayName: {
      _type: 'String',
    },
    joinedTime: {
      _type: 'CreationTime',
    },
    memeCreatedCount: {
      _type: 'Count',
      countedCol: 'meme',
      groupByRef: 'owner',
    },
    memeImageCreatedCount: {
      _type: 'Count',
      countedCol: 'memeImage',
      groupByRef: 'owner',
    },
    profilePicture: {
      _type: 'Image',
    },
  },
};

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

const buildDraft: BuildDraft = ({ spec, context }) => {
  if (spec._type === 'Count') {
    return buildCountDraft({ context, spec });
  }
  if (spec._type === 'Ref') {
    return buildRefDraft({ context, spec });
  }
  if (spec._type === 'CreationTime') {
    return buildCreationTimeDraft({ context, spec });
  }
  return None();
};

export const setDocState = buildSetDocState({
  buildDraft,
  docToR,
  rToDoc,
  spec,
});

export const createDoc = buildCreateDoc({
  cToField,
  spec,
  pGetNewDocId,
  pSetDoc,
});

const initialFetchDoc = buildInitialFetchDoc({
  buildDraft,
  cToField,
  docToR,
  pGetNewDocId,
  pReadDoc,
  pSetDoc,
  rToDoc,
  spec,
});

export const makeDocState = buildMakeDocState({
  initialFetchDoc,
});


export type MemeCDoc = {
  memeImage: MemeImageDoc & { _id: string };
  text: StringCField;
};

export type MemeImageDoc = {
  creationTime: Date;
  image: ImageRField;
  memeCreatedCount: number;
  owner: UserDoc & { _id: string };
};

export type MemeImageCDoc = {
  image: ImageCField;
};

export type UserDoc = {
  displayName: string;
  joinedTime: Date;
  memeCreatedCount: number;
  memeImageCreatedCount: number;
  profilePicture: ImageRField;
};
