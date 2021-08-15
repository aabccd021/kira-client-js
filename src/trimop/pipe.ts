/* eslint-disable import/exports-last */
import { Either, isLeft, isNone, isRight, isSome, Left, None, Option, Right, Some } from 'trimop';

export type C<T> = {
  readonly _: <TResult>(mapper: (t: T) => TResult) => C<TResult>;
  readonly value: () => T;
};

export function Chainable<T>(t: () => T): C<T> {
  return {
    _: (mapper) => Chainable(() => mapper(t())),
    value: t,
  };
}

export function _<T>(t: T): C<T> {
  return {
    _: (mapper) => Chainable(() => mapper(t)),
    value: () => t,
  };
}

// export type Z<TR, T> = {
//   readonly _: <TR2>(mapper: (t: TR) => TR2) => Z<TR, T>;
//   readonly eval: (t: T) => TR;
// };

// export function ZZ<TR, T>(mapper: (t: T) => TR): Z<TR, T> {
//   return {
//     _: mapper,
//     eval: mapper,
//   };
// }

// ZZ
// (eMap<boolean, string, number>((num) => num !== 0))._(eMapLeft((x) => Left(x.left.length))).eval;

// export function c<TR, T>(m: C<(t: T) => TR>): (t: T) => TR {
//   return (t) => m.eval()(t);
// }

export type LeftTo<EResult, E> = (l: Left<E>) => Left<EResult>;

export type Task<T> = () => Promise<T>;

export type ToTask<T> = (t: T) => Task<T>;

export type OIdentity<T> = (option: Option<T>) => Option<T>;

export type OFold<TResult, T> = (option: Option<T>) => TResult;

export type OMap<TResult, T> = (option: Option<T>) => Option<TResult>;

export type EIdentity<E, T> = (either: Either<E, T>) => Either<E, T>;

export type Identity<T> = (t: T) => T;

export type EFold<TResult, E, T> = (either: Either<E, T>) => TResult;

export type EMapLeft<EResult, E, T> = (either: Either<E, T>) => Either<EResult, T>;

export type EMap<TResult, E, T> = (either: Either<E, T>) => Either<E, TResult>;

export type TMap<TResult, T> = (task: Task<T>) => Task<TResult>;

export function oGetOrElse<T>(none: T): OFold<T, T> {
  return (option) => (isNone(option) ? none : option.value);
}

export function eDo<E, T>(effect: (t: T) => void): EIdentity<E, T> {
  return (either) => {
    if (isRight(either)) {
      effect(either.right);
    }
    return either;
  };
}

export function oDo<T>(effect: (t: T) => void): OIdentity<T> {
  return (option) => {
    if (isSome(option)) {
      effect(option.value);
    }
    return option;
  };
}

export function eToO<E, T>(e: Either<E, T>): Option<T> {
  return isLeft(e) ? None() : Some(e.right);
}

export function eDoLeft<E, T>(effect: (e: Left<E>) => void): EIdentity<E, T> {
  return (either) => {
    if (isLeft(either)) {
      effect(either);
    }
    return either;
  };
}

export function doEffect<T>(effect: (t: T) => void): Identity<T> {
  return (t) => {
    effect(t);
    return t;
  };
}

export function eFold<TResult, E, T>({
  left,
  right,
}: {
  readonly left: (e: Left<E>) => TResult;
  readonly right: (t: T) => TResult;
}): EFold<TResult, E, T> {
  return (either) => (isLeft(either) ? left(either) : right(either.right));
}

export function eToRight<E, T>(mapper: (l: Left<E>) => T): EFold<T, E, T> {
  return (either) => (isLeft(either) ? mapper(either) : either.right);
}

export function oToSome<T>(mapper: () => T): OFold<T, T> {
  return (option) => (isNone(option) ? mapper() : option.value);
}

export function oFlatten<T>(option: Option<Option<T>>): Option<T> {
  return isNone(option) ? option : option.value;
}

export function eMapLeft<EResult, E, T>(
  mapper: (l: Left<E>) => Left<EResult>
): EMapLeft<EResult, E, T> {
  return (either) => (isLeft(either) ? mapper(either) : either);
}

export function eMap<TResult, E, T>(mapper: (t: T) => TResult): EMap<TResult, E, T> {
  return (either) => (isLeft(either) ? either : Right(mapper(either.right)));
}

export function oMap<TResult, T>(mapper: (t: T) => TResult): OMap<TResult, T> {
  return (option) => (isNone(option) ? option : Some(mapper(option.value)));
}

export function oFrom<T>(t: NonNullable<T> | undefined | null): Option<T> {
  // eslint-disable-next-line no-null/no-null
  return t === undefined || t === null ? None() : Some(t);
}

export function Task<T>(t: T): Task<T> {
  return () => Promise.resolve(t);
}

export function tFrom<T>(p: Promise<T>): Task<T> {
  return () => p;
}

export function tToPromise<T>(task: Task<T>): Promise<T> {
  return task();
}

export function tMap<TResult, T>(mapper: (t: T) => TResult): TMap<TResult, T> {
  return (task) => () => tToPromise(task).then(mapper);
}

export function tParallel<T>(tasks: readonly Task<T>[]): Task<readonly T[]> {
  return () => Promise.all(tasks.map(tToPromise));
}

export function leftTo<EResult, E>(mapper: (t: E) => EResult): LeftTo<EResult, E> {
  return (l) => ({
    _tag: 'Left',
    errorObject: l.errorObject,
    left: mapper(l.left),
  });
}

export function doTaskEffect<T>(effect: (t: T) => void): Identity<Task<T>> {
  return (t) => {
    tToPromise(t);
    return t;
  };
}

// eslint-disable-next-line functional/prefer-type-literal
export interface Dict<T> {
  readonly [index: string]: NonNullable<T>;
}

export type DLookup<T> = (dict: Dict<T>) => Option<T>;

export function dLookup<T>(key: string): DLookup<T> {
  return (dict) => oFrom(dict[key]);
}

export type DMap<TR, T> = (dict: Dict<T>) => readonly TR[];

export function dMap<TR, T>(
  mapper: (field: T, fieldName: string, index: number) => TR
): DMap<TR, T> {
  return (dict) =>
    Object.entries(dict).map(([fieldName, field], index) => mapper(field, fieldName, index));
}

export function toTaskRight<T>(t: T): Task<Right<T>> {
  return _(t)._(Right)._(Task).value();
}

export function toTaskRightSome<T>(t: T): Task<Right<Some<T>>> {
  return _(t)._(Some)._(toTaskRight).value();
}

export function toRightSome<T>(t: T): Right<Some<T>> {
  return _(t)._(Some)._(Right).value();
}

export function toTaskLeft<T>(t: T): Task<Left<T>> {
  return _(t)._(Left)._(Task).value();
}

export function bind<A, B>(mapper: (b: B) => A): (t: B) => readonly [B, A] {
  return (b) => [b, mapper(b)];
}

export function bind2<A, B, C>(
  mapper: (b: B, c: C) => A
): (t: readonly [B, C]) => readonly [B, C, A] {
  return ([b, c]) => [b, c, mapper(b, c)];
}

export type OCompact3<A, B, C> = (
  t: readonly [Option<A>, Option<B>, Option<C>]
) => Option<readonly [A, B, C]>;

export function oCompact2<B, A>([b, a]: readonly [Option<B>, Option<A>]): Option<readonly [B, A]> {
  return isSome(b) && isSome(a) ? Some([b.value, a.value]) : None();
}

export function oCompact3<B, C, A>([b, c, a]: readonly [Option<B>, Option<C>, Option<A>]): Option<
  readonly [B, C, A]
> {
  const prev = oCompact2([b, c]);
  return isSome(a) && isSome(prev) ? Some(bind2<A, B, C>(() => a.value)(prev.value)) : None();
}

export function oMap2<T, A, B>(
  mapper: (a: A, b: B) => T
): (o: Option<readonly [A, B]>) => Option<T> {
  return (option) => (isNone(option) ? option : Some(mapper(...option.value)));
}

export function oMap3<T, A, B, C>(
  mapper: (a: A, b: B, c: C) => T
): (o: Option<readonly [A, B, C]>) => Option<T> {
  return (option) => (isNone(option) ? option : Some(mapper(...option.value)));
}

export function oDo2<A, B>(effect: (a: A, b: B) => void): Identity<Option<readonly [A, B]>> {
  return (option) => {
    if (isSome(option)) {
      effect(...option.value);
    }
    return option;
  };
}

export function oDo3<A, B, C>(
  effect: (a: A, b: B, c: C) => void
): Identity<Option<readonly [A, B, C]>> {
  return (option) => {
    if (isSome(option)) {
      effect(...option.value);
    }
    return option;
  };
}

export type TEMap<TResult, E, T> = (task: Task<Either<E, T>>) => Task<Either<E, TResult>>;

export function teMap<TResult, E, T>(mapper: (e: T) => TResult): TEMap<TResult, E, T> {
  return tMap(eMap(mapper));
}

export type OEMap<TResult, E, T> = (task: Option<Either<E, T>>) => Option<Either<E, TResult>>;

export function oeMap<TResult, E, T>(mapper: (e: T) => TResult): OEMap<TResult, E, T> {
  return oMap(eMap(mapper));
}
// export function eMap<TResult, E, T>(mapper: (t: T) => TResult): EMap<TResult, E, T> {
//   return (either) => (isLeft(either) ? either : Right(mapper(either.right)));
// }

// export type EMapLeft<EResult, E, T> = (either: Either<E, T>) => Either<EResult, T>;

// export function eMapLeft<EResult, E, T>(
//   mapper: (l: Left<E>) => Left<EResult>
// ): EMapLeft<EResult, E, T> {
//   return (either) => (isLeft(either) ? mapper(either) : either);
// }

export type TEFold<TResult, E, T> = (either: Task<Either<E, T>>) => Task<TResult>;

export function teToRight<E, T>(mapper: (l: Left<E>) => T): TEFold<T, E, T> {
  return tMap(eToRight(mapper));
}
