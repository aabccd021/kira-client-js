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
import * as D from '../trimop/dict';
import * as E from '../trimop/either';
import { _, flow } from '../trimop/function';
import * as O from '../trimop/option';
import * as OE from '../trimop/option-either';
import * as OP from '../trimop/option-tuple';
import * as T from '../trimop/task';
import * as TE from '../trimop/task-either';
import * as P from '../trimop/tuple';
import * as PO from '../trimop/tuple-option';
import { Task } from '../trimop/type';
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
        ._(O.map((docState) => (docState.state === 'Ready' ? rToDoc(col)(docState.data) : {})))
        ._(O.getOrElse(() => ({})))
        ._(Right)
        ._v()
    )
      // TODO: curry getTransactionCommit
      ._((getDoc) => T.fromPromise(getTransactionCommit({ actionTrigger, getDoc, snapshot })))
      ._(
        TE.map((transactionCommit) =>
          _(transactionCommit)
            ._(
              D.mapEntries((colDocs, col) =>
                _(colDocs)
                  ._(
                    D.mapEntries((docCommit, id) => {
                      _({ col, id })
                        ._(_getDocState)
                        ._(
                          O.chain((docState) =>
                            docState.state === 'Ready'
                              ? _(docState.data)._(rToDoc(col))._(Some)._v()
                              : None()
                          )
                        )
                        ._(OE.toOption)
                        // TODO: curry applyDocWrite
                        ._(O.map((doc) => applyDocWrite({ doc, writeDoc: docCommit.writeDoc })))
                        ._(
                          OE.map(
                            flow(docToR)._(readyDocState(id))._(_setDocState({ col, id }))._val()
                          )
                        )
                        ._v();
                    })
                  )
                  ._v()
              )
            )
            ._v()
        )
      )
      ._v();
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
  return _(getCachedTrigger({ buildDraft, spec }))._(D.lookup(col))._v();
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
      // ._(doEffect(() => _setDocState(key)(newDocState)))
      ._(P.bind2(() => (newDocState.state === 'Ready' ? Some(newDocState) : None())))
      ._(P.bind3(() => getColTrigger({ buildDraft, col: key.col, spec })))
      ._(P.bind4(() => Some(buildRunTrigger({ col: key.col, docToR, rToDoc }))))
      ._(PO.compact4)
      ._(
        OP.map4((oldDocState, newDocState, colTrigger, runTrigger) =>
          oldDocState.state === 'Ready'
            ? _(colTrigger.onUpdate)
                ._(P.bind2(() => _(oldDocState.data)._(rToDoc(key.col))._(E.toOption)._v()))
                ._(P.bind3(() => _(newDocState.data)._(rToDoc(key.col))._(E.toOption)._v()))
                ._(PO.compact3)
                ._(
                  OP.map3((actionTrigger, before, after) =>
                    runTrigger({ actionTrigger, snapshot: { after, before, id: newDocState.id } })
                  )
                )
                ._v()
            : _(colTrigger.onDelete)
                ._(P.bind2(() => _(newDocState.data)._(rToDoc(key.col))._(E.toOption)._v()))
                ._(PO.compact2)
                ._(
                  OP.map2((actionTrigger, doc) =>
                    runTrigger({ actionTrigger, snapshot: { doc, id: newDocState.id } })
                  )
                )
                ._v()
        )
      )
      ._(O.flatten)
      // ._(O.map(tDo))
      ._v();
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
    // ._(doEffect(() => _deleteDocState(key)))
    ._(O.chain((docState) => (docState.state === 'Ready' ? Some(docState) : None())))
    ._(P.bind2(O.chain((docState) => _(docState.data)._(rToDoc(key.col))._(E.toOption)._v())))
    ._(
      P.bind3(() =>
        _(getColTrigger({ buildDraft, col: key.col, spec }))
          ._(O.chain((colTrigger) => colTrigger.onDelete))
          ._v()
      )
    )
    ._(P.bind4(() => Some(buildRunTrigger({ col: key.col, docToR, rToDoc }))))
    ._(PO.compact4)
    ._(
      OP.map4((docState, doc, actionTrigger, runTrigger) =>
        runTrigger({ actionTrigger, snapshot: { doc, id: docState.id } })
      )
    )
    // ._(O.map(tDo))
    ._v();
}

export { _getDocState as getDocState, _subscribeToDocState as subscribeToDocState };
