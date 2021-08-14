import { Either, eitherFold, isRight, Left, optionFold, Right, Some } from 'trimop';

import { getDocState } from '../listenable/doc';
import {
  ContainsErrorDocState,
  CreateDoc,
  CreatingDocState,
  CToFieldError,
  DocState,
  DocToR,
  InitialFetchDoc,
  NotExistsDocState,
  PGetNewDocIdError,
  PReadDoc,
  PReadDocError,
  PReadDocResult,
  PSetDocError,
  ReadyDocState,
  SetDocState,
} from '../type';

export function buildInitialFetchDoc<PRDE extends PReadDocError>(args: {
  readonly createDoc: CreateDoc<CToFieldError, PSetDocError, PGetNewDocIdError>;
  readonly docToR: DocToR;
  readonly pReadDoc: PReadDoc<PRDE>;
  readonly setDocState: SetDocState<PRDE>;
}): InitialFetchDoc<PRDE> {
  const { setDocState, pReadDoc, docToR, createDoc } = args;

  return (key) =>
    optionFold<Promise<Either<PRDE, DocState<PRDE>>>, DocState>(
      getDocState(key),
      async () => {
        const newDocState = eitherFold<Either<PRDE, DocState<PRDE>>, PRDE, PReadDocResult>(
          await pReadDoc(key),
          (left) => {
            setDocState(
              key,
              ContainsErrorDocState({
                error: Left(left),
                revalidate: () => {
                  const initialFetchDoc = buildInitialFetchDoc(args);
                  initialFetchDoc(key);
                },
              })
            );
            return Left(left);
          },
          (remoteDoc) =>
            Right(
              remoteDoc.state === 'notExists'
                ? NotExistsDocState({
                    create: (cDoc) => {
                      setDocState(key, CreatingDocState());
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
          setDocState(key, newDocState.right);
        }
        return newDocState;
      },
      (docState) => Promise.resolve(Right(docState) as Either<PRDE, DocState<PRDE>>)
    );
}
