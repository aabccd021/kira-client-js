import { onAuthChange } from '../cache';
import { AuthState, Observable } from '../types';

export function makeAuth<AE, DBE, SIO>(): Observable<AuthState<AE, DBE, SIO>> {
  return {
    initialState: { state: 'initializing' },
    onChange: onAuthChange,
  };
}
