import { Option, StateController } from 'trimop';
import { DB, Listen, Unsubscribe } from './type';
export declare function reset(dbController: StateController<DB>): undefined;
export declare function deleteRecord(dbController: StateController<DB>, key: string): undefined;
export declare function getRecord<T>(db: StateController<DB>, key: string): Option<T>;
export declare function setRecord<T>(dbController: StateController<DB>, key: string, newValue: Option<T>): undefined;
export declare function subscribeToRecord<T>(dbController: StateController<DB>, key: string, newListen: Listen<T>): Unsubscribe;
//# sourceMappingURL=kv.d.ts.map