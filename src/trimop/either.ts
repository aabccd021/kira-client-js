import { none, some } from './option';
import * as tuple from './tuple';
import { Either, Left, Option, Right } from './type';

export function right<A>(right: A): Right<A> {
  return { _tag: 'Right', right };
}

export function left<B>(left: B): Left<B> {
  return {
    _tag: 'Left',
    errorObject: new Error(),
    left,
  };
}

/**
 *
 * @param either
 * @returns
 */
export function isRight<T>(either: Either<unknown, T>): either is Right<T> {
  return either._tag === 'Right';
}

/**
 *
 * @param either
 * @returns
 */
export function isLeft<E>(either: Either<E, unknown>): either is Left<E> {
  return either._tag === 'Left';
}

// export function Do<E, T>(effect: (t: T) => void): Identity<Either<E, T>> {
//   return (either) => {
//     if (isRight(either)) {
//       effect(either.right);
//     }
//     return either;
//   };
// }

// export function DoLeft<E, T>(effect: (e: Left<E>) => void): EIdentity<E, T> {
//   return (either) => {
//     if (isLeft(either)) {
//       effect(either);
//     }
//     return ither;
//   };
// }

// export function Fold<TResult, E, T>({
//   left,
//   right,
// }: {
//   readonly left: (e: Left<E>) => TResult;
//   readonly right: (t: T) => TResult;
// }): EFold<TResult, E, T> {
//   return (either) => (isLeft(either) ? left(either) : right(either.right));
// }

// export function ToRight<E, T>(mapper: (l: Left<E>) => T): EFold<T, E, T> {
//   return (either) => (isLeft(either) ? mapper(either) : either.right);
// }

export function flatten<E, T>(e: Either<E, Either<E, T>>): Either<E, T> {
  return isLeft(e) ? e : e.right;
}

export type LeftTo<EResult, E> = (l: Left<E>) => Left<EResult>;

export function leftTo<EResult, E>(mapper: (t: E) => EResult): LeftTo<EResult, E> {
  return (l) => ({
    _tag: 'Left',
    errorObject: l.errorObject,
    left: mapper(l.left),
  });
}

export type EFold<TResult, E, T> = (either: Either<E, T>) => TResult;

export type MapsLeft<EResult, E, T> = (either: Either<E, T>) => Either<EResult, T>;

export type Maps<TResult, E, T> = (either: Either<E, T>) => Either<E, TResult>;

export function mapLeft<EResult, E, T>(mapper: (l: E) => EResult): MapsLeft<EResult, E, T> {
  return (either) => (isLeft(either) ? leftTo(mapper)(either) : either);
}

export function map<TResult, E, T>(mapper: (t: T) => TResult): Maps<TResult, E, T> {
  return (either) => (isLeft(either) ? either : Right(mapper(either.right)));
}

export function compact2<E, B, A>([b, a]: readonly [Either<E, B>, Either<E, A>]): Either<
  E,
  readonly [B, A]
> {
  return isRight(b) ? (isRight(a) ? Right([b.right, a.right]) : a) : b;
}

export function map2<T, E, A, B>(
  mapper: (a: A, b: B) => T
): (o: Either<E, readonly [A, B]>) => Either<E, T> {
  return map(tuple.map2(mapper));
}

export function toOption<B, A>(e: Either<B, A>): Option<A> {
  return isLeft(e) ? none : some(e.right);
}

export function getOrElse<E, T>(mapper: (l: Left<E>) => T): EFold<T, E, T> {
  return (either) => (isLeft(either) ? mapper(either) : either.right);
}