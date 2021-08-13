import { DocKey, Spec } from 'kira-core';
import { BuildDraft } from 'kira-nosql';
import { Option } from 'trimop';
import { CDoc, DocState, DocToR, Listen, RDoc, RToDoc, Unsubscribe } from '../type';
/**
 *
 * @param key
 * @param newListen
 * @returns
 */
declare function _subscribeToDocState<E, R extends RDoc = RDoc, C extends CDoc = CDoc>(key: DocKey, newListen: Listen<DocState<E, R, C>>): Unsubscribe;
/**
 *
 * @param key
 * @returns
 */
declare function _getDocState<E, R extends RDoc = RDoc, C extends CDoc = CDoc>(key: DocKey): Option<DocState<E, R, C>>;
export declare function setDocState<E, R extends RDoc = RDoc, C extends CDoc = CDoc>({ buildDraft, docToR, key, newDocState, rToDoc, spec, }: {
    readonly buildDraft: BuildDraft;
    readonly docToR: DocToR;
    readonly key: DocKey;
    readonly newDocState: Option<DocState<E, R, C>>;
    readonly rToDoc: RToDoc;
    readonly spec: Spec;
}): undefined;
export declare function deleteDocState({ buildDraft, key, spec, rToDoc, docToR, }: {
    readonly buildDraft: BuildDraft;
    readonly docToR: DocToR;
    readonly key: DocKey;
    readonly rToDoc: RToDoc;
    readonly spec: Spec;
}): undefined;
export { _getDocState as getDocState, _subscribeToDocState as subscribeToDocState };
//# sourceMappingURL=doc.d.ts.map