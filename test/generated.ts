/* eslint-disable no-use-before-define */
import { Spec } from 'kira-core';
import { buildCountDraft, buildCreationTimeDraft, BuildDraft, buildRefDraft } from 'kira-nosql';
import { Left, None } from 'trimop';

import {
  buildCreateDoc,
  buildInitialFetchDoc,
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
} from '../src';

const pGetNewDocId: PGetNewDocId<PGetNewDocIdError> = jest.fn();
const pSetDoc: PSetDoc<PSetDocError> = jest.fn();
const pUploadImage: PUploadImage<PUploadImageError> = jest.fn();
const pReadDoc: PReadDoc<PReadDocError> = jest.fn();

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

const setDocState = buildSetDocState({
  buildDraft,
  docToR,
  rToDoc,
  spec,
});

const createDoc = buildCreateDoc({
  cToField,
  docToR,
  pGetNewDocId,
  pSetDoc,
  setDocState,
  spec,
});

const initialFetchDoc = buildInitialFetchDoc({
  createDoc,
  docToR,
  pReadDoc,
  setDocState,
});

export const makeDocState = buildMakeDocState({
  initialFetchDoc,
});
