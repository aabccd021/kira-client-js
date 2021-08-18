import * as E from './either';
import { _ } from './function';
import * as T from './task';
import { Either, Left, Right, Task } from './type';

export function right<A>(t: A): Task<Right<A>> {
  return _(t)._(E.right)._(T.task)._v();
}

export function left<B>(t: B): Task<Left<B>> {
  return _(t)._(E.left)._(T.task)._v();
}

export type TEMap<AResult, B, A> = (task: Task<Either<B, A>>) => Task<Either<B, AResult>>;

export function map<AResult, B, A>(mapper: (a: A) => AResult): TEMap<AResult, B, A> {
  return T.map(E.map(mapper));
}

export function flatten<E, T>(e: Task<Either<E, Task<Either<E, T>>>>): Task<Either<E, T>> {
  return _(e)
    ._(T.map((e) => (E.isLeft(e) ? Task(e) : e.right)))
    ._(T.flatten)
    ._v();
}

export function chain<TResult, E, T>(
  mapper: (t: T) => Task<Either<E, TResult>>
): TEMap<TResult, E, T> {
  return (te) => _(te)._(map(mapper))._(flatten)._v();
}

export function chainFirst<E, T>(chainer: (t: T) => Task<Either<E, unknown>>): TEMap<T, E, T> {
  return (te) =>
    _(te)
      ._(
        chain((first) =>
          _(first)
            ._(chainer)
            ._(map(() => first))
            ._v()
        )
      )
      ._v();
}

export type TEFold<TResult, E, T> = (either: Task<Either<E, T>>) => Task<TResult>;

export function getOrElse<E, T>(mapper: (l: Left<E>) => T): TEFold<T, E, T> {
  return T.map(E.getOrElse(mapper));
}

export type MapsLeft<EResult, E, T> = T.Maps<Either<EResult, T>, Either<E, T>>;

export function mapLeft<EResult, E, T>(mapper: (l: E) => EResult): MapsLeft<EResult, E, T> {
  return T.map(E.mapLeft(mapper));
}
