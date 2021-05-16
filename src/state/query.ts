import { onQueryStateChange } from '../cache';
import { fetchQuery } from '../service';
import { DbpQuery, Observable, Query, QueryState } from '../types';

export function makeQuery<DBC, DBE>({
  dbpQuery,
  query,
}: {
  query: Query;
  dbpQuery: DbpQuery<DBC, DBE>;
}): Observable<QueryState<DBE>> {
  return {
    initialState: { state: 'initializing' },
    onChange: (listener) => {
      fetchQuery({ query, dbpQuery });
      const unsubscribe = onQueryStateChange(query, listener);
      return unsubscribe;
    },
  };
}
