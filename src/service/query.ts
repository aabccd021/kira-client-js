import { getQueryState, setDoc, setQueryState } from '../cache';
import { DbpQuery, Query } from '../types';

export async function fetchQuery<DBC, DBE>({
  dbpQuery,
  query,
  cursor,
}: {
  readonly query: Query;
  readonly dbpQuery: DbpQuery<DBC, DBE>;
  readonly cursor?: DBC;
}): Promise<void> {
  const cached = getQueryState(query);

  if (cached?.state === 'loaded' && cursor === undefined) {
    return;
  }

  if (cached?.state === 'loaded' && cached.hasMore) {
    setQueryState(query, { ...cached, isFetching: true });
  }

  const queryResult = await dbpQuery(query, cursor);
  if (queryResult._tag === 'left') {
    setQueryState(query, { state: 'error', error: queryResult.error });
    return;
  }

  queryResult.value.docs.forEach(({ key, data }) => {
    setDoc(key, {
      state: 'exists',
      doc: { ...key, ...data },
    });
  });

  const queriedDocKeys = queryResult.value.docs.map(({ key }) => key);

  const hasMore = query.limit && queryResult.value.docs.length >= query.limit;

  const newKeys = cached?.state === 'loaded' ? [...cached.keys, ...queriedDocKeys] : queriedDocKeys;

  if (hasMore) {
    setQueryState(query, {
      state: 'loaded',
      keys: newKeys,
      hasMore: true,
      isFetching: false,
      fetchNext: () => fetchQuery({ dbpQuery, query, cursor: queryResult.value.cursor }),
    });
    return;
  }
  setQueryState(query, {
    state: 'loaded',
    keys: newKeys,
    hasMore: false,
  });
}
