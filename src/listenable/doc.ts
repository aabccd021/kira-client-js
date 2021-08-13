import { applyDocWrite, DocKey, DocSnapshot, Spec } from 'kira-core';
import {
  ActionTrigger,
  BuildDraft,
  DocChange,
  getTransactionCommit,
  getTrigger,
  Trigger,
  TriggerSnapshot,
} from 'kira-nosql';
import {
  eitherMapRight,
  getStateController,
  isLeft,
  None,
  Option,
  optionFold,
  optionFromNullable,
  optionMapSome,
  Right,
  Some,
} from 'trimop';

import { getCached } from '../cached';
import { deleteRecord, getRecord, setRecord, subscribeToRecord } from '../kv';
import {
  CDoc,
  DB,
  DocState,
  DocToR,
  Listen,
  RDoc,
  ReadyDocState,
  RToDoc,
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
function _subscribeToDocState<E, R extends RDoc = RDoc, C extends CDoc = CDoc>(
  key: DocKey,
  newListen: Listen<DocState<E, R, C>>
): Unsubscribe {
  return subscribeToRecord(dbController, serializeDocKey(key), newListen);
}

/**
 *
 * @param key
 * @returns
 */
function _getDocState<E, R extends RDoc = RDoc, C extends CDoc = CDoc>(
  key: DocKey
): Option<DocState<E, R, C>> {
  return getRecord(dbController, serializeDocKey(key));
}

/**
 *
 * @param key
 * @param newDocState
 * @returns
 */
function _setDocState<E, R extends RDoc = RDoc, C extends CDoc = CDoc>(
  key: DocKey,
  newDocState: Option<DocState<E, R, C>>
): undefined {
  return setRecord(dbController, serializeDocKey(key), newDocState);
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
  snapshot,
  actionTrigger,
  docToR,
  rToDoc,
}: {
  readonly actionTrigger: ActionTrigger<S> | undefined;
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
          (docState) => (docState.state === 'Ready' ? rToDoc(docState.data) : {})
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
        (docState) =>
          eitherMapRight(
            applyDocWrite({
              doc: docState.state === 'Ready' ? Some(rToDoc(docState.data)) : None(),
              writeDoc: docCommit.writeDoc,
            }),
            (newDoc) =>
              Right(_setDocState(key, Some(ReadyDocState({ data: docToR(newDoc), id: docId }))))
          )
      );
    });
  });
}

function getCachedTrigger({
  spec,
  buildDraft,
}: {
  readonly buildDraft: BuildDraft;
  readonly spec: Spec;
}): Trigger {
  return getCached({
    builder: () => getTrigger({ buildDraft, spec }),
    key: 'trigger',
  });
}

export function setDocState<E, R extends RDoc = RDoc, C extends CDoc = CDoc>({
  buildDraft,
  docToR,
  key,
  newDocState,
  rToDoc,
  spec,
}: {
  readonly buildDraft: BuildDraft;
  readonly docToR: DocToR;
  readonly key: DocKey;
  readonly newDocState: Option<DocState<E, R, C>>;
  readonly rToDoc: RToDoc;
  readonly spec: Spec;
}): undefined {
  const oldState = _getDocState(key);
  _setDocState(key, newDocState);
  optionMapSome(newDocState, (newDocState) => {
    // onUpdate
    if (newDocState.state === 'Ready') {
      optionMapSome(
        optionFromNullable(getCachedTrigger({ buildDraft, spec })?.[key.col]),
        (colTrigger) =>
          optionMapSome(oldState, (oldState) =>
            oldState.state === 'Ready'
              ? optionMapSome(colTrigger.onUpdate, (onColDeleteTrigger) =>
                  Some(
                    runTrigger<DocChange>({
                      actionTrigger: onColDeleteTrigger,
                      docToR,
                      rToDoc,
                      snapshot: {
                        after: rToDoc(newDocState.data),
                        before: rToDoc(oldState.data),
                        id: newDocState.id,
                      },
                    })
                  )
                )
              : optionMapSome(colTrigger.onCreate, (onColCreateTrigger) =>
                  Some(
                    runTrigger<DocSnapshot>({
                      actionTrigger: onColCreateTrigger,
                      docToR,
                      rToDoc,
                      snapshot: {
                        doc: rToDoc(newDocState.data),
                        id: newDocState.id,
                      },
                    })
                  )
                )
          )
      );
    }
    // onCreate
    return Some(undefined);
  });
  return undefined;
}

// TODO: make code more pretty
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
}): undefined {
  const docState = _getDocState(key);
  _deleteDocState(key);
  optionMapSome(docState, (docState) => {
    if (docState.state === 'Ready') {
      optionMapSome(
        optionFromNullable(getCachedTrigger({ buildDraft, spec })?.[key.col]),
        (colTrigger) =>
          optionMapSome(colTrigger.onDelete, (onColDeleteTrigger) =>
            Some(
              runTrigger<DocSnapshot>({
                actionTrigger: onColDeleteTrigger,
                docToR,
                rToDoc,
                snapshot: {
                  doc: rToDoc(docState.data),
                  id: docState.id,
                },
              })
            )
          )
      );
    }
    return Some(undefined);
  });
  return undefined;
}

export { _getDocState as getDocState, _subscribeToDocState as subscribeToDocState };
