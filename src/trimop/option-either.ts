import * as E from './either';
import { _ } from './function';
import * as O from './option';
import { Either, Option } from './type';

export type OEMap<TResult, E, T> = (task: Option<Either<E, T>>) => Option<Either<E, TResult>>;

export function map<TResult, E, T>(mapper: (e: T) => TResult): OEMap<TResult, E, T> {
  return O.map(E.map(mapper));
}

export function toOption<B, A>(e: Option<Either<B, A>>): Option<Option<A>> {
  return _(e)._(O.map(E.toOption))._v();
}
