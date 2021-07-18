import { DocKey } from 'kira-nosql';

import {
  BaseState,
  DocState,
  Listener,
  NeverUndefined,
  Observable,
  Query,
  Subject,
  Unsubscribe,
} from './types';

// Debug
const _debug_logOnSubscribe = false;
const _debug_logOnSetState = false;

// Disallow undefined state so state can be set if not undefined when first subscribed
type Cached<T extends BaseState> = {
  readonly state: NeverUndefined<T> | undefined;
  // eslint-disable-next-line functional/prefer-readonly-type
  readonly listeners: { [key: string]: Listener<T> };
};

// global Cache
// eslint-disable-next-line functional/prefer-readonly-type
const cache: { [key: string]: Cached<BaseState> } = {};

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

function serializeDocKey({ col, id }: DocKey): string {
  return `doc-${col}-${id}`;
}

function serializeQuery({ collection, orderByField, orderDirection }: Query): string {
  return `query-${collection}-${orderByField}-${orderDirection}`;
}

/**
 * Auth
 */
export function setAuth<E, SIO>(newAuth: AuthState<E, SIO>): void {
  setState(authKey, newAuth);
}

export function onAuthChange<E, SIO>(listener: Listener<AuthState<E, SIO>>): Unsubscribe {
  return subscribe(authKey, listener);
}

export function getAuth<E, SIO>(): AuthState<E, SIO> | undefined {
  return getState<AuthState<E, SIO>>(authKey);
}

/**
 * Doc
 */
export function setDoc({ key, doc }: { readonly key: DocKey; readonly doc: DocState }): void {
  const serializedKey = serializeDocKey(key);
  setState(serializedKey, doc);
}

export function onDocChange<E>(key: DocKey, listener: Listener<DocState<E>>): Unsubscribe {
  const serializedKey = serializeDocKey(key);
  return subscribe(serializedKey, listener);
}

export function getDoc(key: DocKey): DocState | undefined {
  const serializedKey = serializeDocKey(key);
  return getState(serializedKey);
}

/**
 * Query
 */
export function setQueryState<E>(query: Query, newQueryState: QueryState<E>): void {
  const serializedKey = serializeQuery(query);
  setState(serializedKey, newQueryState);
}

export function onQueryStateChange<E>(
  query: Query,
  listener: Listener<QueryState<E>>
): Unsubscribe {
  const serializedKey = serializeQuery(query);
  return subscribe(serializedKey, listener);
}

export function getQueryState<E>(query: Query): QueryState<E> | undefined {
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
