import { DocToR, GetDocStateCtxIfAbsent, PReadDoc, pReadDocDocStateErr, PReadDocErr } from '../..';
import { _ } from '../../trimop/function';
import * as TE from '../../trimop/task-either';
import { containsErrDocStateCtx, notExistsDocStateCtx, readyDocStateCtx } from '../../type';

export function buildGetDocStateCtxIfAbsent<PRDE extends PReadDocErr>({
  pReadDoc,
  docToR,
}: {
  readonly docToR: DocToR;
  readonly pReadDoc: PReadDoc<PRDE>;
}): GetDocStateCtxIfAbsent {
  return (key) =>
    _(key)
      ._(pReadDoc)
      ._(
        TE.map((remoteDoc) =>
          remoteDoc.state === 'exists'
            ? _(remoteDoc.data)._(docToR)._(readyDocStateCtx(key.id))._v()
            : notExistsDocStateCtx(key)
        )
      )
      ._(TE.mapLeft(pReadDocDocStateErr))
      ._(TE.getOrElse(containsErrDocStateCtx(key)))
      ._v();
}
