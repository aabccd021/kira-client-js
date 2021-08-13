"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToDocState = exports.getDocState = exports.deleteDocState = exports.setDocState = void 0;
const kira_core_1 = require("kira-core");
const kira_nosql_1 = require("kira-nosql");
const trimop_1 = require("trimop");
const cached_1 = require("../cached");
const kv_1 = require("../kv");
const type_1 = require("../type");
const dbController = trimop_1.getStateController({});
/**
 *
 * @param param0
 * @returns
 */
function serializeDocKey({ col, id }) {
    return `${col}-${id}`;
}
/**
 *
 * @param key
 * @param newListen
 * @returns
 */
function _subscribeToDocState(key, newListen) {
    return kv_1.subscribeToRecord(dbController, serializeDocKey(key), newListen);
}
exports.subscribeToDocState = _subscribeToDocState;
/**
 *
 * @param key
 * @returns
 */
function _getDocState(key) {
    return kv_1.getRecord(dbController, serializeDocKey(key));
}
exports.getDocState = _getDocState;
/**
 *
 * @param key
 * @param newDocState
 * @returns
 */
function _setDocState(key, newDocState) {
    return kv_1.setRecord(dbController, serializeDocKey(key), newDocState);
}
/**
 *
 * @param key
 * @returns
 */
function _deleteDocState(key) {
    return kv_1.deleteRecord(dbController, serializeDocKey(key));
}
async function runTrigger({ snapshot, actionTrigger, docToR, rToDoc, }) {
    if (actionTrigger === undefined) {
        return;
    }
    const transactionCommit = await kira_nosql_1.getTransactionCommit({
        actionTrigger,
        getDoc: async (key) => trimop_1.Right(trimop_1.optionFold(_getDocState(key), () => ({}), (docState) => (docState.state === 'Ready' ? rToDoc(docState.data) : {}))),
        snapshot,
    });
    // TODO: return left
    if (trimop_1.isLeft(transactionCommit)) {
        console.warn('Failed to get transaction commit');
        return;
    }
    Object.entries(transactionCommit.right).forEach(([colName, colDocs]) => {
        Object.entries(colDocs).forEach(([docId, docCommit]) => {
            const key = { col: colName, id: docId };
            trimop_1.optionFold(_getDocState(key), () => trimop_1.Right(undefined), (docState) => trimop_1.eitherMapRight(kira_core_1.applyDocWrite({
                doc: docState.state === 'Ready' ? trimop_1.Some(rToDoc(docState.data)) : trimop_1.None(),
                writeDoc: docCommit.writeDoc,
            }), (newDoc) => trimop_1.Right(_setDocState(key, trimop_1.Some(type_1.ReadyDocState({ data: docToR(newDoc), id: docId }))))));
        });
    });
}
function getCachedTrigger({ spec, buildDraft, }) {
    return cached_1.getCached({
        builder: () => kira_nosql_1.getTrigger({ buildDraft, spec }),
        key: 'trigger',
    });
}
function setDocState({ buildDraft, docToR, key, newDocState, rToDoc, spec, }) {
    const oldState = _getDocState(key);
    _setDocState(key, newDocState);
    trimop_1.optionMapSome(newDocState, (newDocState) => {
        var _a;
        // onUpdate
        if (newDocState.state === 'Ready') {
            trimop_1.optionMapSome(trimop_1.optionFromNullable((_a = getCachedTrigger({ buildDraft, spec })) === null || _a === void 0 ? void 0 : _a[key.col]), (colTrigger) => trimop_1.optionMapSome(oldState, (oldState) => oldState.state === 'Ready'
                ? trimop_1.optionMapSome(colTrigger.onUpdate, (onColDeleteTrigger) => trimop_1.Some(runTrigger({
                    actionTrigger: onColDeleteTrigger,
                    docToR,
                    rToDoc,
                    snapshot: {
                        after: rToDoc(newDocState.data),
                        before: rToDoc(oldState.data),
                        id: newDocState.id,
                    },
                })))
                : trimop_1.optionMapSome(colTrigger.onCreate, (onColCreateTrigger) => trimop_1.Some(runTrigger({
                    actionTrigger: onColCreateTrigger,
                    docToR,
                    rToDoc,
                    snapshot: {
                        doc: rToDoc(newDocState.data),
                        id: newDocState.id,
                    },
                })))));
        }
        // onCreate
        return trimop_1.Some(undefined);
    });
    return undefined;
}
exports.setDocState = setDocState;
// TODO: make code more pretty
function deleteDocState({ buildDraft, key, spec, rToDoc, docToR, }) {
    const docState = _getDocState(key);
    _deleteDocState(key);
    trimop_1.optionMapSome(docState, (docState) => {
        var _a;
        if (docState.state === 'Ready') {
            trimop_1.optionMapSome(trimop_1.optionFromNullable((_a = getCachedTrigger({ buildDraft, spec })) === null || _a === void 0 ? void 0 : _a[key.col]), (colTrigger) => trimop_1.optionMapSome(colTrigger.onDelete, (onColDeleteTrigger) => trimop_1.Some(runTrigger({
                actionTrigger: onColDeleteTrigger,
                docToR,
                rToDoc,
                snapshot: {
                    doc: rToDoc(docState.data),
                    id: docState.id,
                },
            }))));
        }
        return trimop_1.Some(undefined);
    });
    return undefined;
}
exports.deleteDocState = deleteDocState;
//# sourceMappingURL=doc.js.map