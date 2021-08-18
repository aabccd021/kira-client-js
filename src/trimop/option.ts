import { _ } from './function';
import { None, Option, Some } from './type';

export function some<T>(value: T): Some<T> {
  return { _tag: 'Some', value };
}

export const none: Option<never> = { _tag: 'None' };

export function isNone(option: Option<unknown>): option is None {
  return option._tag === 'None';
}

export function isSome<T>(option: Option<T>): option is Some<T> {
  return option._tag === 'Some';
}

// export function fromEither<E, T>(e: Either<E, T>): Option<T> {
//   return isLeft(e) ? None() : Some(e.right);
// }

export function fromNullable<T>(nullable: NonNullable<T> | undefined | null): Option<T> {
  // eslint-disable-next-line no-null/no-null
  return nullable === undefined || nullable === null ? none : some(nullable);
}

export function flatten<T>(option: Option<Option<T>>): Option<T> {
  return isNone(option) ? option : option.value;
}

export type OMap<TResult, T> = (option: Option<T>) => Option<TResult>;

export function map<TResult, T>(mapper: (t: T) => TResult): OMap<TResult, T> {
  return (option) => (isNone(option) ? option : some(mapper(option.value)));
}

export function chain<TResult, T>(mapper: (t: T) => Option<TResult>): OMap<TResult, T> {
  return (option) => _(option)._(map(mapper))._(flatten)._v();
}

export type GetOrElse<T> = (option: Option<T>) => T;

export function getOrElse<T>(mapper: () => T): GetOrElse<T> {
  return (option) => (isNone(option) ? mapper() : option.value);
}
