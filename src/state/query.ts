import { onQueryStateChange } from '../cache';
import { fetchQuery } from '../service';
import { DbpQuery, Observable, Query, QueryState } from '../types';

export function makeQuery<DBC, E>({
  dbpQuery,
  query,
}: {
  readonly dbpQuery: DbpQuery<DBC, E>;
  readonly query: Query;
}): Observable<QueryState<E>> {
  return {
    initialState: { state: 'initializing' },
    onChange: (listener) => {
      fetchQuery({ query, dbpQuery });
      const unsubscribe = onQueryStateChange(query, listener);
      return unsubscribe;
    },
  };
}
