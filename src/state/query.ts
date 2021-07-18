import { onQueryStateChange } from '../cache';
import { fetchQuery } from '../service';
import { Observable, PQuery, Query, QueryState } from '../types';

export function makeQuery<DBC>({
  dbpQuery,
  query,
}: {
  readonly dbpQuery: PQuery<DBC>;
  readonly query: Query;
}): Observable<QueryState> {
  return {
    initialState: { state: 'initializing' },
    onChange: (listener) => {
      fetchQuery({ query, dbpQuery });
      return onQueryStateChange(query, listener);
    },
  };
}
