import { applyDocWrite, ApplyDocWriteError, Doc, DocKey, DocSnapshot, Spec } from 'kira-core';
import {
  ActionTrigger,
  BuildDraft,
  ColTrigger,
  DocChange,
  getTransactionCommit,
  getTrigger,
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
  optionFromNullable,
  Right,
  Some,
} from 'trimop';

import { getCached } from '../cached';
import { deleteRecord, getRecord, setRecord, subscribeToRecord } from '../kv';
import { _, bind2, bindL, eToO, oCompact3, oDo, oFlatten, oMap } from '../trimop/pipe';
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
  readonly actionTrigger: ActionTrigger<S> | undefined;
  readonly col: string;
  readonly docToR: DocToR;
  readonly rToDoc: RToDoc;
  readonly snapshot: S;
}): Promise<void> {
  if (actionTrigger === undefined) {
    return;
  }

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
  return optionFromNullable(
    getCached({
      builder: () => getTrigger({ buildDraft, spec }),
      key: 'trigger',
    })?.[col]
  );
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
    const oldState = _getDocState(key);
    _setDocState(key, newDocState);
    if (newDocState.state === 'Ready') {
      optionFold(
        getColTrigger({ buildDraft, col: key.col, spec }),
        () => undefined,
        (colTrigger) =>
          optionFold(
            oldState,
            () => undefined,
            (oldState) => {
              oldState.state === 'Ready'
                ? optionFold(
                    colTrigger.onUpdate,
                    () => undefined,
                    (onColDeleteTrigger) =>
                      eitherFold(
                        rToDoc(key.col, newDocState.data),
                        () => undefined,
                        (after) =>
                          optionFold(
                            after,
                            () => undefined,
                            (after) =>
                              eitherFold(
                                rToDoc(key.col, oldState.data),
                                () => undefined,
                                (before) =>
                                  optionFold(
                                    before,
                                    () => undefined,
                                    (before) =>
                                      runTrigger<DocChange>({
                                        actionTrigger: onColDeleteTrigger,
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
                          )
                      )
                  )
                : optionFold(
                    colTrigger.onCreate,
                    () => undefined,
                    (onColCreateTrigger) =>
                      eitherFold(
                        rToDoc(key.col, newDocState.data),
                        () => undefined,
                        (doc) =>
                          optionFold(
                            doc,
                            () => undefined,
                            (doc) =>
                              runTrigger<DocSnapshot>({
                                actionTrigger: onColCreateTrigger,
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
                  );
            }
          )
      );
    }
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
      bindL((docState) =>
        _(docState)
          ._(oMap((docState) => _(rToDoc(key.col, docState.data))._(eToO).eval()))
          ._(oFlatten)
          ._(oFlatten)
          .eval()
      )
    )
    ._(
      bind2(
        _(getColTrigger({ buildDraft, col: key.col, spec }))
          ._(oMap((colTrigger) => colTrigger.onDelete))
          ._(oFlatten)
          .eval()
      )
    )
    ._(oCompact3)
    ._(
      oDo(([docState, doc, onColDeleteTrigger]) =>
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
