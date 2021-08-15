import { applyDocWrite, DocKey, DocSnapshot, Spec } from 'kira-core';
import {
  ActionTrigger,
  BuildDraft,
  ColTrigger,
  DocChange,
  DraftGetTransactionCommitError,
  GetDoc,
  getTransactionCommit,
  TriggerSnapshot,
} from 'kira-nosql';
import { Either, getStateController, None, Option, Right, Some } from 'trimop';

import { getCachedTrigger } from '../cached';
import { deleteRecord, getRecord, setRecord, subscribeToRecord } from '../kv';
import {
  _,
  bind,
  bind2,
  dLookup,
  dMap,
  doEffect,
  eToO,
  oCompact2,
  oCompact3,
  oDo3,
  oeMap,
  oFlatten,
  oMap,
  oMap2,
  oMap3,
  oToSome,
  Task,
  teMap,
  tFrom,
  tDo,
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

function runTrigger<S extends TriggerSnapshot>({
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
}): Task<Either<DraftGetTransactionCommitError, unknown>> {
  // TODO: GetDoc = Option<Doc>
  return _<GetDoc>(async (key) =>
    _(key)
      ._(_getDocState)
      ._(oMap((docState) => (docState.state === 'Ready' ? rToDoc(col, docState.data) : {})))
      ._(oToSome(() => ({})))
      ._(Right)
      .value()
  )
    ._((getDoc) => tFrom(getTransactionCommit({ actionTrigger, getDoc, snapshot })))
    ._(
      teMap((transactionCommit) =>
        _(transactionCommit)
          ._(
            dMap((colDocs, col) =>
              _(colDocs)
                ._(
                  dMap((docCommit, id) => {
                    _({ col, id })
                      ._(_getDocState)
                      ._(
                        oMap((docState) =>
                          docState.state === 'Ready' ? Some(rToDoc(col, docState.data)) : None()
                        )
                      )
                      ._(oFlatten)
                      ._(oMap(eToO))
                      ._(oFlatten)
                      ._(oMap((doc) => applyDocWrite({ doc, writeDoc: docCommit.writeDoc })))
                      ._(
                        oeMap((newDoc) =>
                          _(newDoc)
                            ._(docToR)
                            ._((data) => _setDocState({ col, id }, ReadyDocState({ data, id })))
                            .value()
                        )
                      )
                      .value();
                  })
                )
                .value()
            )
          )
          .value()
      )
    )
    .value();
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
  return _(getCachedTrigger({ buildDraft, spec }))._(dLookup(col)).value();
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
    _(_getDocState(key))
      ._(doEffect(() => _setDocState(key, newDocState)))
      ._(bind(() => (newDocState.state === 'Ready' ? Some(newDocState) : None())))
      ._(bind2(() => getColTrigger({ buildDraft, col: key.col, spec })))
      ._(oCompact3)
      ._(
        oMap3((oldDocState, newDocState, colTrigger) =>
          oldDocState.state === 'Ready'
            ? _(colTrigger.onUpdate)
                ._(bind(() => _(rToDoc(key.col, oldDocState.data))._(eToO)._(oFlatten).value()))
                ._(bind2(() => _(rToDoc(key.col, newDocState.data))._(eToO)._(oFlatten).value()))
                ._(oCompact3)
                ._(
                  oMap3((actionTrigger, before, after) =>
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
                .value()
            : _(colTrigger.onDelete)
                ._(bind(() => _(rToDoc(key.col, newDocState.data))._(eToO)._(oFlatten).value()))
                ._(oCompact2)
                ._(
                  oMap2((actionTrigger, doc) =>
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
                .value()
        )
      )
      ._(oFlatten)
      ._(oMap((runTrigger) => _(runTrigger)._(tDo).value()))
      .value();
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
          ._(oMap((docState) => _(rToDoc(key.col, docState.data))._(eToO).value()))
          ._(oFlatten)
          ._(oFlatten)
          .value()
      )
    )
    ._(
      bind2(() =>
        _(getColTrigger({ buildDraft, col: key.col, spec }))
          ._(oMap((colTrigger) => colTrigger.onDelete))
          ._(oFlatten)
          .value()
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
    .value();
}

export { _getDocState as getDocState, _subscribeToDocState as subscribeToDocState };
