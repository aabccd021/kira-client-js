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
  neverCToFieldErr,
  cToImageField,
  cToRefField,
  cToStringField,
  docToR,
  getAuthState,
  ImageCField,
  ImageRField,
  PGetNewDocId,
  PGetNewDocIdErr,
  PReadDoc,
  PReadDocErr,
  PSetDoc,
  PSetDocErr,
  PUploadImage,
  PUploadImageErr,
  rToCountField,
  rToCreationTimeField,
  RToField,
  neverRToFieldErr,
  rToImageField,
  rToRefField,
  rToStringField,
  StringCField,
} from '../src';
import { buildGetDocStateCtxIfAbsent } from '../src/service/pure/initial-fetch-doc';

export const pGetNewDocId = jest.fn<
  ReturnType<PGetNewDocId<PGetNewDocIdErr>>,
  Parameters<PGetNewDocId<PGetNewDocIdErr>>
>();

export const pSetDoc = jest.fn<
  ReturnType<PSetDoc<PSetDocErr>>,
  Parameters<PSetDoc<PSetDocErr>>
>();

export const pUploadImage: PUploadImage<PUploadImageErr> = jest.fn();
export const pReadDoc = jest.fn<
  ReturnType<PReadDoc<PReadDocErr>>,
  Parameters<PReadDoc<PReadDocErr>>
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

const rToField: RToField = ({ ctx, fieldSpec }) => {
  if (fieldSpec._type === 'Image') {
    return rToImageField({ ctx, fieldSpec });
  }
  if (fieldSpec._type === 'String') {
    return rToStringField({ ctx, fieldSpec });
  }
  if (fieldSpec._type === 'Ref') {
    return rToRefField({ ctx, fieldSpec, rToDoc });
  }
  if (fieldSpec._type === 'Count') {
    return rToCountField({ ctx, fieldSpec });
  }
  if (fieldSpec._type === 'CreationTime') {
    return rToCreationTimeField({ ctx, fieldSpec });
  }
  return Left(neverRToFieldErr(fieldSpec));
};

const rToDoc = buildRToDoc(spec, rToField);

const cToField: CToField = async ({ ctx, fieldSpec }) => {
  if (fieldSpec._type === 'Image') {
    return cToImageField({ ctx, fieldSpec, getAuthState, pUploadImage });
  }
  if (fieldSpec._type === 'String') {
    return cToStringField({ ctx, fieldSpec });
  }
  if (fieldSpec._type === 'Ref') {
    return cToRefField({ ctx, fieldSpec, getAuthState, rToDoc });
  }
  if (fieldSpec._type === 'Count') {
    return cToCountField({ ctx, fieldSpec });
  }
  if (fieldSpec._type === 'CreationTime') {
    return cToCreationTimeField({ ctx, fieldSpec });
  }
  return Left(neverCToFieldErr(fieldSpec));
};

const buildDraft: BuildDraft = ({ spec, ctx }) => {
  if (spec._type === 'Count') {
    return buildCountDraft({ ctx, spec });
  }
  if (spec._type === 'Ref') {
    return buildRefDraft({ ctx, spec });
  }
  if (spec._type === 'CreationTime') {
    return buildCreationTimeDraft({ ctx, spec });
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
  pGetNewDocId,
  pSetDoc,
  spec,
});

const initialFetchDoc = buildGetDocStateCtxIfAbsent({
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
