import { applyDocWrite, DocKey, Spec } from 'kira-core';
import {
  ActionTrigger,
  BuildDraft,
  ColTrigger,
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
  bind2,
  bind3,
  bind4,
  dLookup,
  dMapEntries,
  doEffect,
  eToO,
  flow,
  oChain,
  oCompact2,
  oCompact3,
  oCompact4,
  oeMap,
  oFlatten,
  oGetOrElse,
  oMap,
  opMap2,
  opMap3,
  opMap4,
  Task,
  tDo,
  teMap,
  tFrom,
} from '../trimop/pipe';
import {
  DB,
  DocState,
  DocToR,
  Listen,
  readyDocState,
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
 * TODO: void setRecord
 * @param key
 * @param newDocState
 * @returns
 */
function _setDocState(key: DocKey): (newDocState: DocState) => void {
  return (newDocState) => setRecord<DocState>(dbController, serializeDocKey(key), newDocState);
}

/**
 *
 * @param key
 * @returns
 */
function _deleteDocState(key: DocKey): undefined {
  return deleteRecord(dbController, serializeDocKey(key));
}

function buildRunTrigger({
  col,
  docToR,
  rToDoc,
}: {
  readonly col: string;
  readonly docToR: DocToR;
  readonly rToDoc: RToDoc;
}): <S extends TriggerSnapshot>(p: {
  readonly actionTrigger: ActionTrigger<S>;
  readonly snapshot: S;
}) => Task<Either<DraftGetTransactionCommitError, unknown>> {
  // TODO: GetDoc = Option<Doc>
  return ({ actionTrigger, snapshot }) =>
    _<GetDoc>(async (key) =>
      _(key)
        ._(_getDocState)
        ._(oMap((docState) => (docState.state === 'Ready' ? rToDoc(col)(docState.data) : {})))
        ._(oGetOrElse(() => ({})))
        ._(Right)
        ._val()
    )
      // TODO: curry getTransactionCommit
      ._((getDoc) => tFrom(getTransactionCommit({ actionTrigger, getDoc, snapshot })))
      ._(
        teMap((transactionCommit) =>
          _(transactionCommit)
            ._(
              dMapEntries((colDocs, col) =>
                _(colDocs)
                  ._(
                    dMapEntries((docCommit, id) => {
                      _({ col, id })
                        ._(_getDocState)
                        ._(
                          oChain((docState) =>
                            docState.state === 'Ready'
                              ? _(docState.data)._(rToDoc(col))._(Some)._val()
                              : None()
                          )
                        )
                        ._(oMap(eToO))
                        // TODO: curry applyDocWrite
                        ._(oMap((doc) => applyDocWrite({ doc, writeDoc: docCommit.writeDoc })))
                        ._(
                          oeMap(
                            flow(docToR)._(readyDocState(id))._(_setDocState({ col, id }))._val()
                          )
                        )
                        ._val();
                    })
                  )
                  ._val()
              )
            )
            ._val()
        )
      )
      ._val();
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
  return _(getCachedTrigger({ buildDraft, spec }))._(dLookup(col))._val();
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
    _(key)
      ._(_getDocState)
      ._(doEffect(() => _setDocState(key)(newDocState)))
      ._(bind2(() => (newDocState.state === 'Ready' ? Some(newDocState) : None())))
      ._(bind3(() => getColTrigger({ buildDraft, col: key.col, spec })))
      ._(bind4(() => Some(buildRunTrigger({ col: key.col, docToR, rToDoc }))))
      ._(oCompact4)
      ._(
        opMap4((oldDocState, newDocState, colTrigger, runTrigger) =>
          oldDocState.state === 'Ready'
            ? _(colTrigger.onUpdate)
                ._(bind2(() => _(oldDocState.data)._(rToDoc(key.col))._(eToO)._val()))
                ._(bind3(() => _(newDocState.data)._(rToDoc(key.col))._(eToO)._val()))
                ._(oCompact3)
                ._(
                  opMap3((actionTrigger, before, after) =>
                    runTrigger({ actionTrigger, snapshot: { after, before, id: newDocState.id } })
                  )
                )
                ._val()
            : _(colTrigger.onDelete)
                ._(bind2(() => _(newDocState.data)._(rToDoc(key.col))._(eToO)._val()))
                ._(oCompact2)
                ._(
                  opMap2((actionTrigger, doc) =>
                    runTrigger({ actionTrigger, snapshot: { doc, id: newDocState.id } })
                  )
                )
                ._val()
        )
      )
      ._(oFlatten)
      ._(oMap(tDo))
      ._val();
  };
}

/**
 * TODO: error should not be made none (disable eToO), use oToE instead
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
  _(key)
    ._(_getDocState)
    ._(doEffect(() => _deleteDocState(key)))
    ._(oChain((docState) => (docState.state === 'Ready' ? Some(docState) : None())))
    ._(bind2(oChain((docState) => _(docState.data)._(rToDoc(key.col))._(eToO)._val())))
    ._(
      bind3(() =>
        _(getColTrigger({ buildDraft, col: key.col, spec }))
          ._(oChain((colTrigger) => colTrigger.onDelete))
          ._val()
      )
    )
    ._(bind4(() => Some(buildRunTrigger({ col: key.col, docToR, rToDoc }))))
    ._(oCompact4)
    ._(
      opMap4((docState, doc, actionTrigger, runTrigger) =>
        runTrigger({ actionTrigger, snapshot: { doc, id: docState.id } })
      )
    )
    ._(oMap(tDo))
    ._val();
}

export { _getDocState as getDocState, _subscribeToDocState as subscribeToDocState };
