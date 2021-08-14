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
        console.log('empty', key);
        const newDocState = eitherFold<Either<PRDE, DocState<PRDE>>, PRDE, PReadDocResult>(
          await pReadDoc(key),
          (left) => {
            console.log('left', key);
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
        console.log(newDocState);
        if (isRight(newDocState)) {
          console.log('right', key);
          setDocState(key, newDocState.right);
        }
        console.log('hmm', key);
        return newDocState;
      },
      (docState) => {
        console.log('empty', key);
        return Promise.resolve(Right(docState) as Either<PRDE, DocState<PRDE>>);
      }
    );
}
