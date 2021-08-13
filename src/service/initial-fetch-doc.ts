import { DocKey, Spec } from 'kira-core';
import { BuildDraft } from 'kira-nosql';
import { Either, eitherFold, isRight, Left, optionFold, Right, Some } from 'trimop';

import { getDocState, setDocState } from '../listenable/doc';
import {
  ContainsErrorDocState,
  CreatingDocState,
  CToFieldError,
  DocState,
  DocToR,
  NotExistsDocState,
  PGetNewDocIdError,
  PReadDoc,
  PReadDocError,
  PReadDocResult,
  PSetDocError,
  ReadyDocState,
  RToDoc,
} from '../type';
import { CreateDoc } from './create-doc';

export async function initialFetchDoc<PRDE extends PReadDocError>(args: {
  readonly buildDraft: BuildDraft;
  readonly createDoc: CreateDoc<CToFieldError, PSetDocError, PGetNewDocIdError>;
  readonly docToR: DocToR;
  readonly key: DocKey;
  readonly provider: {
    readonly readDoc: PReadDoc<PRDE>;
  };
  readonly rToDoc: RToDoc;
  readonly spec: Spec;
}): Promise<Either<unknown, DocState<PRDE>>> {
  const { key, provider, buildDraft, docToR, rToDoc, spec, createDoc } = args;

  return optionFold<Promise<Either<PRDE, DocState<PRDE>>>, DocState<unknown>>(
    getDocState(key),
    async () => {
      const newDocState = eitherFold<Either<PRDE, DocState<PRDE>>, PRDE, PReadDocResult>(
        await provider.readDoc(key),
        (left) => {
          setDocState({
            buildDraft,
            docToR,
            key,
            newDocState: ContainsErrorDocState({
              error: Left(left),
              revalidate: () => initialFetchDoc(args),
            }),
            rToDoc,
            spec,
          });
          return Left(left);
        },
        (remoteDoc) =>
          Right(
            remoteDoc.state === 'notExists'
              ? NotExistsDocState({
                  create: (cDoc) => {
                    setDocState({
                      buildDraft,
                      docToR,
                      key,
                      newDocState: CreatingDocState({}),
                      rToDoc,
                      spec,
                    });
                    createDoc({
                      cDoc,
                      col: key.col,
                      id: Some(key.id),
                    });
                  },
                })
              : ReadyDocState({
                  data: docToR(remoteDoc.data),
                  id: key.id,
                })
          )
      );
      if (isRight(newDocState)) {
        setDocState({
          buildDraft,
          docToR,
          key,
          newDocState: newDocState.right,
          rToDoc,
          spec,
        });
      }
      return newDocState;
    },
    (docState) => Promise.resolve(Right(docState) as Either<PRDE, DocState<PRDE>>)
  );
}
