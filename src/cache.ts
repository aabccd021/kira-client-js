import { Dictionary } from 'kira-core';

import {
  AuthState,
  BaseState,
  DocKey,
  DocState,
  Listener,
  NeverUndefined,
  Observable,
  Query,
  QueryState,
  Subject,
  Unsubscribe,
} from './types';

// Debug
const _debug_logOnSubscribe = false;
const _debug_logOnSetState = false;

// Disallow undefined state so state can be set if not undefined when first subscribed
type Cached<T extends BaseState> = {
  readonly state: NeverUndefined<T> | undefined;
  readonly listeners: Dictionary<Listener<T>>;
};

// global Cache
const cache: Dictionary<Cached<BaseState>> = {};

// eslint-disable-next-line functional/no-let
let listenerId = 0;

function makeNewCached(): Cached<BaseState> {
  return {
    state: undefined,
    listeners: {},
  };
}

function subscribe<T extends BaseState>(
  key: string,
  newListener: Listener<NeverUndefined<T>>
): Unsubscribe {
  listenerId += 1;
  const thisListenerId = listenerId.toString();
  const cached: Cached<BaseState> = cache[key] ?? makeNewCached();
  const newCached: Cached<BaseState> = {
    state: cached.state,
    listeners: {
      ...cached.listeners,
      [thisListenerId]: newListener as Listener<unknown>,
    },
  };

  // set cache
  // eslint-disable-next-line functional/immutable-data
  cache[key] = newCached;

  // set state on subscribe if state not undefined
  if (newCached.state !== undefined) {
    newListener(newCached.state as NeverUndefined<T>);
  }

  if (_debug_logOnSubscribe) {
    console.table(
      Object.fromEntries(
        Object.entries(cache).map(([key, val]) => [
          key,
          {
            state: val.state?.state,
            listeners: Object.entries(val.listeners).length,
          },
        ])
      )
    );
  }

  function unsubscribe(): void {
    delete cache[key]?.listeners?.[thisListenerId];

    const listenersIsEmpty = !cache[key]?.listeners;
    if (listenersIsEmpty) {
      // eslint-disable-next-line functional/immutable-data
      delete cache[key];
    }
  }

  return unsubscribe;
}

function setState<T extends BaseState>(key: string, newState: NeverUndefined<T>): void {
  const cached: Cached<BaseState> = cache[key] ?? makeNewCached();
  const newCached: Cached<BaseState> = {
    ...cached,
    state: newState,
  };

  if (_debug_logOnSetState) {
    console.table([{ [key]: cached.state?.state }, { [key]: newState.state }]);
  }

  // eslint-disable-next-line functional/immutable-data
  cache[key] = newCached;

  Object.values(cached.listeners).forEach((listener) => listener(newState));
}

function getState<T>(key: string): T | undefined {
  return cache[key]?.state as T | undefined;
}

/**
 * Serialize Keys
 */
const authKey = 'auth';

function serializeDocKey({ collection, id }: DocKey): string {
  return `doc-${collection}-${id}`;
}

function serializeQuery({ collection, orderByField, orderDirection }: Query): string {
  return `query-${collection}-${orderByField}-${orderDirection}`;
}

/**
 * Auth
 */
export function setAuth<AE, DBE, SIO>(newAuth: AuthState<AE, DBE, SIO>): void {
  setState(authKey, newAuth);
}

export function onAuthChange<AE, DBE, SIO>(
  listener: Listener<AuthState<AE, DBE, SIO>>
): Unsubscribe {
  return subscribe(authKey, listener);
}

export function getAuth<AE, DBE, SIO>(): AuthState<AE, DBE, SIO> | undefined {
  return getState<AuthState<AE, DBE, SIO>>(authKey);
}

/**
 * Doc
 */
export function setDoc<DBE>(key: DocKey, newDoc: DocState<DBE>): void {
  const serializedKey = serializeDocKey(key);
  setState(serializedKey, newDoc);
}

export function onDocChange<DBE>(key: DocKey, listener: Listener<DocState<DBE>>): Unsubscribe {
  const serializedKey = serializeDocKey(key);
  return subscribe(serializedKey, listener);
}

export function getDoc<DBE>(key: DocKey): DocState<DBE> | undefined {
  const serializedKey = serializeDocKey(key);
  return getState(serializedKey);
}

/**
 * Query
 */
export function setQueryState<DBE>(query: Query, newQueryState: QueryState<DBE>): void {
  const serializedKey = serializeQuery(query);
  setState(serializedKey, newQueryState);
}

export function onQueryStateChange<DBE>(
  query: Query,
  listener: Listener<QueryState<DBE>>
): Unsubscribe {
  const serializedKey = serializeQuery(query);
  return subscribe(serializedKey, listener);
}

export function getQueryState<DBE>(query: Query): QueryState<DBE> | undefined {
  const serializedKey = serializeQuery(query);
  return getState(serializedKey);
}

/**
 * Subject
 */
export function makeSubject<T extends BaseState>(initialState: T): Subject<T> {
  listenerId += 1;
  const subjectKey = `subject-${listenerId}`;
  return {
    get: () => getState<T>(subjectKey) ?? initialState,
    set: (newState) => setState(subjectKey, newState),
    onChange: (listener) => {
      const unsubscribe = subscribe(subjectKey, listener);
      return unsubscribe;
    },
  };
}

export function subjectToObservable<T extends BaseState>(
  subject: Subject<T>,
  options?: { readonly onInit?: () => Unsubscribe | void }
): Observable<T> {
  return {
    initialState: subject.get(),
    onChange: (handleChange) => {
      const unsubscribe2 = subject.onChange(handleChange);
      const unsubscribe = options?.onInit?.();
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe?.();
        }
        unsubscribe2();
      };
    },
  };
}
