import { Either, isLeft, isNone, isRight, Left, Option, Right, Some } from 'trimop';

export type Chainable<T> = {
  readonly _: <TResult>(mapper: (t: T) => TResult) => Chainable<TResult>;
  readonly eval: () => T;
};

export function Chainable<T>(t: () => T): Chainable<T> {
  return {
    _: (mapper) => Chainable(() => mapper(t())),
    eval: t,
  };
}

export function _<T>(t: T): Chainable<T> {
  return {
    _: (mapper) => Chainable(() => mapper(t)),
    eval: () => t,
  };
}

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

export function toTask<T>(t: T): Task<T> {
  return () => Promise.resolve(t);
}

export function tToPromise<T>(task: Task<T>): Promise<T> {
  return task();
}

export function tMap<TResult, T>(mapper: (t: T) => TResult): TMap<TResult, T> {
  return (task) => () => tToPromise(task).then(mapper);
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
    return () => tToPromise(t).then(effect).then(t);
  };
}
