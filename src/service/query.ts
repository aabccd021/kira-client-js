import { getQueryState, setDoc, setQueryState } from '../cache';
import { DbpQuery, Query } from '../types';

export async function fetchQuery<DBC, E>({
  cursor,
  dbpQuery,
  query,
}: {
  readonly cursor?: DBC;
  readonly dbpQuery: DbpQuery<DBC, E>;
  readonly query: Query;
}): Promise<void> {
  const cached = getQueryState<E>(query);

  if (cached?.state === 'loaded' && cursor === undefined) {
    return;
  }

  if (cached?.state === 'loaded' && cached.hasMore) {
    setQueryState(query, {
      ...cached,
      isFetching: true,
    });
  }

  const queryResult = await dbpQuery(query, cursor);
  if (queryResult.tag === 'left') {
    setQueryState(query, {
      state: 'error',
      error: queryResult.error,
    });

    return;
  }

  queryResult.value.docs.forEach(({ key, data }) => {
    setDoc(key, {
      state: 'exists',
      doc: { ...key, ...data },
    });
  });

  const queriedDocKeys = queryResult.value.docs.map(({ key }) => key);

  const newKeys = cached?.state === 'loaded' ? [...cached.keys, ...queriedDocKeys] : queriedDocKeys;

  // has more docs
  if (query.limit && queryResult.value.docs.length >= query.limit) {
    setQueryState<E>(query, {
      state: 'loaded',
      keys: newKeys,
      hasMore: true,
      isFetching: false,
      fetchNext: () =>
        fetchQuery({
          cursor: queryResult.value.cursor,
          dbpQuery,
          query,
        }),
    });
    return;
  }

  // all docs loaded
  setQueryState<E>(query, {
    state: 'loaded',
    keys: newKeys,
    hasMore: false,
  });
}
