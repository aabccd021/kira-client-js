import { getStateController, Option, Some } from 'trimop';

import { deleteRecord, getRecord, setRecord, subscribeToRecord } from '../kv';
import { AuthState, DB, Listen, Unsubscribe } from '../type';

const dbController = getStateController<DB>({});
const key = 'auth';

/**
 *
 * @param key
 * @param newListen
 * @returns
 */
export function subscribeToAuthState(newListen: Listen<AuthState>): Unsubscribe {
  return subscribeToRecord(dbController, key, newListen);
}

/**
 *
 * @param key
 * @returns
 */
export function getAuthState(): Option<AuthState> {
  return getRecord(dbController, key);
}

/**
 *
 * @param key
 * @param newAuthState
 * @returns
 */
export function setAuthState(newAuthState: AuthState): undefined {
  return setRecord(dbController, key, Some(newAuthState));
}

/**
 *
 * @param key
 * @returns
 */
export function deleteAuthState(): undefined {
  return deleteRecord(dbController, key);
}
