/* eslint-disable import/exports-last */
import { Either, isLeft, isNone, isRight, isSome, Left, None, Option, Right, Some } from 'trimop';

export type Pipe<T> = {
  readonly _: <TResult>(mapper: (t: T) => TResult) => Pipe<TResult>;
  readonly _val: () => T;
};

export function _<T>(t: T): Pipe<T> {
  return {
    _: (mapper) => _(mapper(t)),
    _val: () => t,
  };
}

export type Flow<TPrev, TInit> = {
  readonly _: <TNext>(mapper: (t: TPrev) => TNext) => Flow<TNext, TInit>;
  readonly _val: () => (p: TInit) => TPrev;
};

export function flow<TEnd, TInit>(mapper: (t: TInit) => TEnd): Flow<TEnd, TInit> {
  return {
    _: (nextMapper) => flow((z) => nextMapper(mapper(z))),
    _val: () => mapper,
  };
}

export type LeftTo<EResult, E> = (l: Left<E>) => Left<EResult>;

export type Task<T> = () => Promise<T>;

export type ToTask<T> = (t: T) => Task<T>;

export type OIdentity<T> = (option: Option<T>) => Option<T>;

export type EIdentity<E, T> = (either: Either<E, T>) => Either<E, T>;

export type Identity<T> = (t: T) => T;

export type EFold<TResult, E, T> = (either: Either<E, T>) => TResult;

export type EMapLeft<EResult, E, T> = (either: Either<E, T>) => Either<EResult, T>;

export type EMap<TResult, E, T> = (either: Either<E, T>) => Either<E, TResult>;

export type TMap<TResult, T> = (task: Task<T>) => Task<TResult>;

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

export type OFold<TResult, T> = (option: Option<T>) => TResult;

export type OGetOrElse<T> = (option: Option<T>) => T;

export function oGetOrElse<T>(mapper: () => T): OGetOrElse<T> {
  return (option) => (isNone(option) ? mapper() : option.value);
}

export type OEGetOrElse<E, T> = (oe: Option<Either<E, T>>) => Either<E, T>;

export function oeGetOrLeft<E, T>(mapper: () => E): OEGetOrElse<E, T> {
  return (oe) =>
    _(oe)
      ._(oGetOrElse<Either<E, T>>(() => Left(mapper())))
      ._val();
}

export function oeGetOrRight<E, T>(mapper: () => T): OEGetOrElse<E, T> {
  return (oe) =>
    _(oe)
      ._(oGetOrElse<Either<E, T>>(() => Right(mapper())))
      ._val();
}

export function oFlatten<T>(option: Option<Option<T>>): Option<T> {
  return isNone(option) ? option : option.value;
}

export function eFlatten<E, T>(e: Either<E, Either<E, T>>): Either<E, T> {
  return isLeft(e) ? e : e.right;
}

export function z<T>(p: () => Promise<() => Promise<T>>): () => Promise<T> {
  return () => p().then((r) => r());
}

export function tFlatten<T>(e: Task<Task<T>>): Task<T> {
  return () => e().then((r) => r());
}

export function leftTo<EResult, E>(mapper: (t: E) => EResult): LeftTo<EResult, E> {
  return (l) => ({
    _tag: 'Left',
    errorObject: l.errorObject,
    left: mapper(l.left),
  });
}

export function eMapLeft<EResult, E, T>(mapper: (l: E) => EResult): EMapLeft<EResult, E, T> {
  return (either) => (isLeft(either) ? leftTo(mapper)(either) : either);
}

export function eMap<TResult, E, T>(mapper: (t: T) => TResult): EMap<TResult, E, T> {
  return (either) => (isLeft(either) ? either : Right(mapper(either.right)));
}

export type OMap<TResult, T> = (option: Option<T>) => Option<TResult>;

export function oMap<TResult, T>(mapper: (t: T) => TResult): OMap<TResult, T> {
  return (option) => (isNone(option) ? option : Some(mapper(option.value)));
}

export function oMapC<TResult, T>(mapper: (t: T) => Pipe<TResult>): OMap<TResult, T> {
  return (option) => (isNone(option) ? option : Some(mapper(option.value)._val()));
}

export function oChain<TResult, T>(mapper: (t: T) => Option<TResult>): OMap<TResult, T> {
  return (option) => _(option)._(oMap(mapper))._(oFlatten)._val();
}

export function oChain2<TResult, T>(mapper: (t: T) => Option<Option<TResult>>): OMap<TResult, T> {
  return (option) => _(option)._(oMap(mapper))._(oFlatten)._(oFlatten)._val();
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

export function tDo<T>(task: Task<T>): Promise<T> {
  return task();
}

export function tMap<TResult, T>(mapper: (t: T) => TResult): TMap<TResult, T> {
  return (task) => () => tDo(task).then(mapper);
}

export function tParallel<T>(tasks: readonly Task<T>[]): Task<readonly T[]> {
  return () => Promise.all(tasks.map(tDo));
}

// export function teParallel<E, T>(
//   tasks: readonly Task<Either<E, T>>[]
// ): Task<Either<E, readonly T[]>> {
//   return tParallel((tasks));
// }

export function doTaskEffect<T>(effect: (t: T) => void): Identity<Task<T>> {
  return (t) => () =>
    tDo(t).then((res) => {
      effect(res);
      return res;
    });
}

// eslint-disable-next-line functional/prefer-type-literal
export interface Dict<T> {
  readonly [index: string]: NonNullable<T>;
}

export type DEntry<T> = readonly [string, NonNullable<T>];

export function dEntry<T>(key: string): (value: NonNullable<T>) => DEntry<T> {
  return (value) => [key, value];
}

export function dFromEntry<T>(entries: readonly DEntry<T>[]): Dict<T> {
  return Object.fromEntries(entries);
}

export type DLookup<T> = (dict: Dict<T>) => Option<T>;

export function dLookup<T>(key: string): DLookup<T> {
  return (dict) => oFrom(dict[key]);
}

export type DMapEntries<TR, T> = (dict: Dict<T>) => readonly TR[];

export function dMapEntries<TR, T>(
  mapper: (field: T, fieldName: string, index: number) => TR
): DMapEntries<TR, T> {
  return (dict) =>
    Object.entries(dict).map(([fieldName, field], index) => mapper(field, fieldName, index));
}

export function dFilter<T>(
  mapper: (field: T, fieldName: string, index: number) => boolean
): Identity<Dict<T>> {
  return (dict) =>
    Object.fromEntries(
      Object.entries(dict).filter(([fieldName, field], index) => mapper(field, fieldName, index))
    );
}

export type DMap<TR, T> = (dict: Dict<T>) => Dict<TR>;

export function dMapValues<TR, T>(
  mapper: (field: T, fieldName: string, index: number) => NonNullable<TR>
): DMap<TR, T> {
  return (dict) =>
    Object.fromEntries(
      Object.entries(dict).map(([fieldName, field], index) => [
        fieldName,
        mapper(field, fieldName, index),
      ])
    );
}

export type DReduce<TR, T> = (dict: Dict<T>) => TR;

export function dReduce<TR, T>(
  initialState: TR,
  reducer: (acc: TR, value: T, key: string, index: number) => TR
): DReduce<TR, T> {
  return (dict) =>
    Object.entries(dict).reduce(
      (acc, [key, value], index) => reducer(acc, value, key, index),
      initialState
    );
}

// export type DEReduce<TR, E, T> = (dict: Dict<Either<E, T>>) => TR;

// export function deReduce<TR,E, T>(
//   initialState: TR,
//   reducer: (acc: TR, value: Either<E, T>, key: string, index: number) => TR
// ): DEReduce<TR,E, T> {
//   return dReduce(initialState, reducer)
// }

export function teRight<T>(t: T): Task<Right<T>> {
  return _(t)._(Right)._(Task)._val();
}

export function toTaskRightSome<T>(t: T): Task<Right<Some<T>>> {
  return _(t)._(Some)._(teRight)._val();
}

export function toRightSome<T>(t: T): Right<Some<T>> {
  return _(t)._(Some)._(Right)._val();
}

export function teLeft<T>(t: T): Task<Left<T>> {
  return _(t)._(Left)._(Task)._val();
}

export type OTEGetOrElse<E, T> = (ote: Option<Task<Either<E, T>>>) => Task<Either<E, T>>;

export function oteGetOrLeft<E, T>(mapper: () => E): OTEGetOrElse<E, T> {
  return (option) =>
    _(option)
      ._(oGetOrElse<Task<Either<E, T>>>(() => teLeft(mapper())))
      ._val();
}

export function oteGetOrRight<E, T>(mapper: () => T): OTEGetOrElse<E, T> {
  return (option) =>
    _(option)
      ._(oGetOrElse<Task<Either<E, T>>>(() => teRight(mapper())))
      ._val();
}

export function bind2<T, A>(mapper: (b: A) => T): (t: A) => readonly [A, T] {
  return (b) => [b, mapper(b)];
}

export function bind3<T, A, B>(
  mapper: (a: A, b: B) => T
): (t: readonly [A, B]) => readonly [A, B, T] {
  return (t) => [...t, mapper(...t)];
}

export function bind4<T, A, B, C>(
  mapper: (a: A, b: B, c: C) => T
): (t: readonly [A, B, C]) => readonly [A, B, C, T] {
  return (t) => [...t, mapper(...t)];
}

export function eCompact2<E, B, A>([b, a]: readonly [Either<E, B>, Either<E, A>]): Either<
  E,
  readonly [B, A]
> {
  return isRight(b) ? (isRight(a) ? Right([b.right, a.right]) : a) : b;
}

export function oCompact2<B, A>([b, a]: readonly [Option<B>, Option<A>]): Option<readonly [B, A]> {
  return isSome(b) && isSome(a) ? Some([b.value, a.value]) : None();
}

export function oCompact3<A, B, T>([a, b, t]: readonly [Option<A>, Option<B>, Option<T>]): Option<
  readonly [A, B, T]
> {
  return _(oCompact2([a, b]))
    ._(
      oChain((prev) =>
        _(t)
          ._(oMap((t) => bind3<T, A, B>(() => t)(prev)))
          ._val()
      )
    )
    ._val();
}

export function oCompact4<A, B, C, T>([a, b, c, t]: readonly [
  Option<A>,
  Option<B>,
  Option<C>,
  Option<T>
]): Option<readonly [A, B, C, T]> {
  return _(oCompact3([a, b, c]))
    ._(
      oChain((prev) =>
        _(t)
          ._(oMap((t) => bind4<T, A, B, C>(() => t)(prev)))
          ._val()
      )
    )
    ._val();
}

export function pMap2<T, A, B>(mapper: (a: A, b: B) => T): (tuple: readonly [A, B]) => T {
  return (tuple) => mapper(...tuple);
}

export function pMap3<T, A, B, C>(
  mapper: (a: A, b: B, c: C) => T
): (tuple: readonly [A, B, C]) => T {
  return (tuple) => mapper(...tuple);
}

export function pMap4<T, A, B, C, D>(
  mapper: (a: A, b: B, c: C, d: D) => T
): (tuple: readonly [A, B, C, D]) => T {
  return (tuple) => mapper(...tuple);
}

export function opMap2<T, A, B>(
  mapper: (a: A, b: B) => T
): (o: Option<readonly [A, B]>) => Option<T> {
  return oMap(pMap2(mapper));
}

export function opMap3<T, A, B, C>(
  mapper: (a: A, b: B, c: C) => T
): (o: Option<readonly [A, B, C]>) => Option<T> {
  return oMap(pMap3(mapper));
}

export function opMap4<T, A, B, C, D>(
  mapper: (a: A, b: B, c: C, d: D) => T
): (o: Option<readonly [A, B, C, D]>) => Option<T> {
  return oMap(pMap4(mapper));
}

export function epMap2<T, E, A, B>(
  mapper: (a: A, b: B) => T
): (o: Either<E, readonly [A, B]>) => Either<E, T> {
  return eMap(pMap2(mapper));
}

export function oDo2<A, B>(effect: (a: A, b: B) => void): Identity<Option<readonly [A, B]>> {
  return (option) => {
    if (isSome(option)) {
      effect(...option.value);
    }
    return option;
  };
}

export function return2<T, A, B>(r: (a: A, b: B) => T): (p: readonly [A, B]) => T {
  return ([a, b]) => r(a, b);
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

export function teFlatten<E, T>(e: Task<Either<E, Task<Either<E, T>>>>): Task<Either<E, T>> {
  return _(e)
    ._(tMap((e) => (isLeft(e) ? Task(e) : e.right)))
    ._(tFlatten)
    ._val();
}

export function teChain<TResult, E, T>(
  mapper: (t: T) => Task<Either<E, TResult>>
): TEMap<TResult, E, T> {
  return (te) => _(te)._(teMap(mapper))._(teFlatten)._val();
}

export type OEMap<TResult, E, T> = (task: Option<Either<E, T>>) => Option<Either<E, TResult>>;

export function oeMap<TResult, E, T>(mapper: (e: T) => TResult): OEMap<TResult, E, T> {
  return oMap(eMap(mapper));
}
// export function eMap<TResult, E, T>(mapper: (t: T) => TResult): EMap<TResult, E, T> {
//   return (either) => (isLeft(either) ? either : Right(mapper(either.right)));
// }

// export function eMapLeft<EResult, E, T>(
//   mapper: (l: Left<E>) => Left<EResult>
// ): EMapLeft<EResult, E, T> {
//   return (either) => (isLeft(either) ? mapper(either) : either);
// }

export type TEFold<TResult, E, T> = (either: Task<Either<E, T>>) => Task<TResult>;

export function teGetOrElse<E, T>(mapper: (l: Left<E>) => T): TEFold<T, E, T> {
  return tMap(eToRight(mapper));
}

export type TEMapLeft<EResult, E, T> = (either: Task<Either<E, T>>) => Task<Either<EResult, T>>;

export function teMapLeft<EResult, E, T>(mapper: (l: E) => EResult): TEMapLeft<EResult, E, T> {
  return tMap(eMapLeft(mapper));
}

export function deCompact<E, T>(de: Dict<Either<E, NonNullable<T>>>): Either<E, Dict<T>> {
  return _(de)
    ._(
      dReduce(Right({}) as Either<E, Dict<T>>, (acc, value, key) =>
        _(acc)
          ._(bind2(() => value))
          ._(eCompact2)
          ._(epMap2((acc, value) => ({ ...acc, [key]: value })))
          ._val()
      )
    )
    ._val();
}

export function doCompact<T>(d: Dict<Option<NonNullable<T>>>): Dict<T> {
  return _(d)
    ._(
      dReduce<Dict<T>, Option<NonNullable<T>>>({}, (acc, field, fieldName) =>
        isNone(field) ? acc : { ...acc, [fieldName]: field.value }
      )
    )
    ._val();
}

export type L<T> = <E>(left: E) => Either<E, T>;

// export function left<T>(left: T): Either<T, unknown> {
//   return { _tag: 'Left', left } as Either<T, unknown>;
// }
