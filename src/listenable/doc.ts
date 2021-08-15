import { applyDocWrite, ApplyDocWriteError, Doc, DocKey, DocSnapshot, Spec } from 'kira-core';
import {
  ActionTrigger,
  BuildDraft,
  ColTrigger,
  DocChange,
  getTransactionCommit,
  TriggerSnapshot,
} from 'kira-nosql';
import {
  Either,
  eitherFold,
  eitherMapRight,
  getStateController,
  isLeft,
  Left,
  None,
  Option,
  optionFold,
  Right,
  Some,
} from 'trimop';

import { getCachedTrigger } from '../cached';
import { deleteRecord, getRecord, setRecord, subscribeToRecord } from '../kv';
import {
  _,
  bind,
  bind2,
  dLookup,
  eToO,
  oCompact2,
  oCompact3,
  oDo2,
  oDo3,
  oFlatten,
  oMap,
  oMap3,
} from '../trimop/pipe';
import {
  DB,
  DocState,
  DocToR,
  Listen,
  ReadyDocState,
  RToDoc,
  SetDocState,
  Unsubscribe,
} from '../type';

const dbController = getStateController<DB>({});

/**
 *
 * @param param0
 * @returns
 */
function serializeDocKey({ col, id }: DocKey): string {
  return `${col}-${id}`;
}

/**
 *
 * @param key
 * @param newListen
 * @returns
 */
function _subscribeToDocState(key: DocKey, newListen: Listen<DocState>): Unsubscribe {
  return subscribeToRecord<DocState>(dbController, serializeDocKey(key), newListen);
}

/**
 *
 * @param key
 * @returns
 */
function _getDocState(key: DocKey): Option<DocState> {
  return getRecord(dbController, serializeDocKey(key));
}

/**
 *
 * @param key
 * @param newDocState
 * @returns
 */
function _setDocState(key: DocKey, newDocState: DocState): undefined {
  return setRecord<DocState>(dbController, serializeDocKey(key), newDocState);
}

/**
 *
 * @param key
 * @returns
 */
function _deleteDocState(key: DocKey): undefined {
  return deleteRecord(dbController, serializeDocKey(key));
}

async function runTrigger<S extends TriggerSnapshot>({
  col,
  snapshot,
  actionTrigger,
  docToR,
  rToDoc,
}: {
  readonly actionTrigger: ActionTrigger<S>;
  readonly col: string;
  readonly docToR: DocToR;
  readonly rToDoc: RToDoc;
  readonly snapshot: S;
}): Promise<void> {
  const transactionCommit = await getTransactionCommit({
    actionTrigger,
    getDoc: async (key) =>
      Right(
        optionFold(
          _getDocState(key),
          () => ({}),
          (docState) => (docState.state === 'Ready' ? rToDoc(col, docState.data) : {})
        )
      ),
    snapshot,
  });

  // TODO: return left
  if (isLeft(transactionCommit)) {
    console.warn('Failed to get transaction commit');
    return;
  }
  Object.entries(transactionCommit.right).forEach(([colName, colDocs]) => {
    Object.entries(colDocs).forEach(([docId, docCommit]) => {
      const key: DocKey = { col: colName, id: docId };
      optionFold(
        _getDocState(key),
        () => Right(undefined),
        (docState) => {
          return eitherMapRight(
            docState.state === 'Ready'
              ? rToDoc(col, docState.data)
              : (Right(None()) as Either<unknown, Option<Doc>>),
            (doc) =>
              eitherFold(
                applyDocWrite({
                  doc,
                  writeDoc: docCommit.writeDoc,
                }),
                (left) => Left(left) as Either<ApplyDocWriteError, unknown>,
                (newDoc) =>
                  Right(_setDocState(key, ReadyDocState({ data: docToR(newDoc), id: docId })))
              )
          );
        }
      );
    });
  });
}

/**
 *
 * @param param0
 * @returns
 */
function getColTrigger({
  spec,
  buildDraft,
  col,
}: {
  readonly buildDraft: BuildDraft;
  readonly col: string;
  readonly spec: Spec;
}): Option<ColTrigger> {
  return _(getCachedTrigger({ buildDraft, spec }))._(dLookup(col)).eval();
}

/**
 *
 * @param param0
 * @returns
 */
export function buildSetDocState({
  buildDraft,
  docToR,
  rToDoc,
  spec,
}: {
  readonly buildDraft: BuildDraft;
  readonly docToR: DocToR;
  readonly rToDoc: RToDoc;
  readonly spec: Spec;
}): SetDocState {
  return (key) => (newDocState) => {
    const oldDocState = _getDocState(key);
    _setDocState(key, newDocState);
    _(oldDocState)
      ._(bind(() => (newDocState.state === 'Ready' ? Some(newDocState) : None())))
      ._(bind2(() => getColTrigger({ buildDraft, col: key.col, spec })))
      ._(oCompact3)
      ._(
        oMap3((oldDocState, newDocState, colTrigger) =>
          oldDocState.state === 'Ready'
            ? _(colTrigger.onUpdate)
                ._(bind(() => _(rToDoc(key.col, oldDocState.data))._(eToO)._(oFlatten).eval()))
                ._(bind2(() => _(rToDoc(key.col, newDocState.data))._(eToO)._(oFlatten).eval()))
                ._(oCompact3)
                ._(
                  oDo3((actionTrigger, before, after) =>
                    runTrigger<DocChange>({
                      actionTrigger,
                      col: key.col,
                      docToR,
                      rToDoc,
                      snapshot: {
                        after,
                        before,
                        id: newDocState.id,
                      },
                    })
                  )
                )
                .eval()
            : _(colTrigger.onDelete)
                ._(bind(() => _(rToDoc(key.col, newDocState.data))._(eToO)._(oFlatten).eval()))
                ._(oCompact2)
                ._(
                  oDo2((actionTrigger, doc) =>
                    runTrigger<DocSnapshot>({
                      actionTrigger,
                      col: key.col,
                      docToR,
                      rToDoc,
                      snapshot: {
                        doc,
                        id: newDocState.id,
                      },
                    })
                  )
                )
                .eval()
        )
      )
      .eval();
  };
}

/**
 * TODO: make code more pretty
 * @param param0
 */
export function deleteDocState({
  buildDraft,
  key,
  spec,
  rToDoc,
  docToR,
}: {
  readonly buildDraft: BuildDraft;
  readonly docToR: DocToR;
  readonly key: DocKey;
  readonly rToDoc: RToDoc;
  readonly spec: Spec;
}): void {
  const docState = _getDocState(key);
  _deleteDocState(key);
  _(docState)
    ._(oMap((docState) => (docState.state === 'Ready' ? Some(docState) : None())))
    ._(oFlatten)
    ._(
      bind((docState) =>
        _(docState)
          ._(oMap((docState) => _(rToDoc(key.col, docState.data))._(eToO).eval()))
          ._(oFlatten)
          ._(oFlatten)
          .eval()
      )
    )
    ._(
      bind2(() =>
        _(getColTrigger({ buildDraft, col: key.col, spec }))
          ._(oMap((colTrigger) => colTrigger.onDelete))
          ._(oFlatten)
          .eval()
      )
    )
    ._(oCompact3)
    ._(
      oDo3((docState, doc, onColDeleteTrigger) =>
        runTrigger<DocSnapshot>({
          actionTrigger: onColDeleteTrigger,
          col: key.col,
          docToR,
          rToDoc,
          snapshot: {
            doc,
            id: docState.id,
          },
        })
      )
    )
    .eval();
}

export { _getDocState as getDocState, _subscribeToDocState as subscribeToDocState };
