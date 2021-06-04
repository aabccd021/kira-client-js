import { onAuthChange } from '../cache';
import { AuthState, Observable } from '../types';

export function makeAuth<E, SIO>(): Observable<AuthState<E, SIO>> {
  return {
    initialState: { state: 'initializing' },
    onChange: onAuthChange,
  };
}
