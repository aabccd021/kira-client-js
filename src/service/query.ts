import { Either } from 'kira-nosql';

import { getQueryState, setDoc, setQueryState } from '../cache';
import { LoadedQueryState, PQuery, PQueryError, Query } from '../types';

export async function fetchQuery<DBC>({
  cursor,
  dbpQuery,
  query,
}: {
  readonly cursor?: DBC;
  readonly dbpQuery: PQuery<DBC>;
  readonly query: Query;
}): Promise<Either<LoadedQueryState, PQueryError>> {
  const cached = getQueryState(query);

  if (cached?.state === 'loaded' && cursor === undefined) {
    return { tag: 'right', value: cached };
  }

  if (cached?.state === 'loaded' && cached.hasMore) {
    setQueryState({
      query,
      queryState: { ...cached, isFetching: true },
    });
  }

  const queryResult = await dbpQuery(query, cursor);
  if (queryResult.tag === 'left') {
    setQueryState({
      query,
      queryState: {
        state: 'error',
        error: queryResult.error,
      },
    });

    return queryResult;
  }

  queryResult.value.docs.forEach(({ key, data }) => {
    setDoc({
      key,
      doc: { state: 'exists', id: key.id, data },
    });
  });

  const queriedDocKeys = queryResult.value.docs.map(({ key }) => key);

  const newKeys = cached?.state === 'loaded' ? [...cached.keys, ...queriedDocKeys] : queriedDocKeys;

  const hasMoreDocs = query.limit && queryResult.value.docs.length >= query.limit;
  const queryState: LoadedQueryState = hasMoreDocs
    ? {
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
      }
    : {
        state: 'loaded',
        keys: newKeys,
        hasMore: false,
      };
  setQueryState({ query, queryState });
  return { tag: 'right', value: queryState };
}
