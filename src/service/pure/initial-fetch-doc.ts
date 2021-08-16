import {
  DocToR,
  GetDocStateCtxIfAbsent,
  PReadDoc,
  pReadDocDocStateError,
  PReadDocError,
} from '../..';
import { _, teGetOrElse, teMap, teMapLeft } from '../../trimop/pipe';
import { containsErrorDocStateCtx, notExistsDocStateCtx, readyDocStateCtx } from '../../type';

export function buildGetDocStateCtxIfAbsent<PRDE extends PReadDocError>({
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
        teMap((remoteDoc) =>
          remoteDoc.state === 'exists'
            ? _(remoteDoc.data)
                ._(docToR)
                ._((data) => readyDocStateCtx({ data, id: key.id }))
                ._val()
            : notExistsDocStateCtx({ key })
        )
      )
      ._(teMapLeft(pReadDocDocStateError))
      ._(teGetOrElse(containsErrorDocStateCtx(key)))
      ._val();
}
