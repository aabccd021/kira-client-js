/* eslint-disable import/exports-last */
import { Either, isLeft, isNone, isSome, Left, None, Option, Right, Some } from 'trimop';

export type Pipe<T> = {
  readonly _: <TResult>(mapper: (t: T) => TResult) => Pipe<TResult>;
  readonly _v: () => T;
};

export function _<T>(t: T): Pipe<T> {
  return {
    _: (mapper) => _(mapper(t)),
    _v: () => t,
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


export type OIdentity<T> = (option: Option<T>) => Option<T>;

// export function oDo<T>(effect: (t: T) => void): OIdentity<T> {
//   return (option) => {
//     if (isSome(option)) {
//       effect(option.value);
//     }
//     return option;
//   };
// }

// export function doEffect<T>(effect: (t: T) => void): Identity<T> {
//   return (t) => {
//     effect(t);
//     return t;
//   };
// }

// export type OFold<TResult, T> = (option: Option<T>) => TResult;
// export type OEGetOrElse<E, T> = (oe: Option<Either<E, T>>) => Either<E, T>;

// export function oeGetOrLeft<E, T>(mapper: () => E): OEGetOrElse<E, T> {
//   return (oe) =>
//     _(oe)
//       ._(O.getOrElse<Either<E, T>>(() => Left(mapper())))
//       ._v();
// }

// export function oeGetOrRight<E, T>(mapper: () => T): OEGetOrElse<E, T> {
//   return (oe) =>
//     _(oe)
//       ._(O.getOrElse<Either<E, T>>(() => Right(mapper())))
//       ._v();
// }









// export function teParallel<E, T>(
//   tasks: readonly T.Task<Either<E, T>>[]
// ): T.Task<Either<E, readonly T[]>> {
//   return tParallel((tasks));
// }

// export type DEReduce<TR, E, T> = (dict: Dict<Either<E, T>>) => TR;

// export function deReduce<TR,E, T>(
//   initialState: TR,
//   reducer: (acc: TR, value: Either<E, T>, key: string, index: number) => TR
// ): DEReduce<TR,E, T> {
//   return dReduce(initialState, reducer)
// }


// export function toaskRightSome<T>(t: T): T.Task<Right<Some<T>>> {
//   return _(t)._(Some)._(teRight)._v();
// }

// export function toRightSome<T>(t: T): Right<Some<T>> {
//   return _(t)._(Some)._(Right)._v();
// }


// export function oCompact2<B, A>([b, a]: readonly [Option<B>, Option<A>]): Option<readonly [B, A]> {
//   return isSome(b) && isSome(a) ? Some([b.value, a.value]) : None();
// }

// export function oCompact3<A, B, T>([a, b, t]: readonly [Option<A>, Option<B>, Option<T>]): Option<
//   readonly [A, B, T]
// > {
//   return _(oCompact2([a, b]))
//     ._(
//       oChain((prev) =>
//         _(t)
//           ._(O.map((t) => bind3<T, A, B>(() => t)(prev)))
//           ._v()
//       )
//     )
//     ._v();
// }

// export function oCompact4<A, B, C, T>([a, b, c, t]: readonly [
//   Option<A>,
//   Option<B>,
//   Option<C>,
//   Option<T>
// ]): Option<readonly [A, B, C, T]> {
//   return _(oCompact3([a, b, c]))
//     ._(
//       oChain((prev) =>
//         _(t)
//           ._(O.map((t) => bind4<T, A, B, C>(() => t)(prev)))
//           ._v()
//       )
//     )
//     ._v();
// }

// export function O.map2<T, A, B>(
//   mapper: (a: A, b: B) => T
// ): (o: Option<readonly [A, B]>) => Option<T> {
//   return O.map(map2(mapper));
// }

// export function O.map3<T, A, B, C>(
//   mapper: (a: A, b: B, c: C) => T
// ): (o: Option<readonly [A, B, C]>) => Option<T> {
//   return O.map(map3(mapper));
// }

// export function O.map4<T, A, B, C, D>(
//   mapper: (a: A, b: B, c: C, d: D) => T
// ): (o: Option<readonly [A, B, C, D]>) => Option<T> {
//   return O.map(map4(mapper));
// }

// export function oDo2<A, B>(effect: (a: A, b: B) => void): Identity<Option<readonly [A, B]>> {
//   return (option) => {
//     if (isSome(option)) {
//       effect(...option.value);
//     }
//     return option;
//   };
// }

// export function return2<T, A, B>(r: (a: A, b: B) => T): (p: readonly [A, B]) => T {
//   return ([a, b]) => r(a, b);
// }

// export function oDo3<A, B, C>(
//   effect: (a: A, b: B, c: C) => void
// ): Identity<Option<readonly [A, B, C]>> {
//   return (option) => {
//     if (isSome(option)) {
//       effect(...option.value);
//     }
//     return option;
//   };
// }

// // export function eMap<TResult, E, T>(mapper: (t: T) => TResult): EMap<TResult, E, T> {
// //   return (either) => (isLeft(either) ? either : Right(mapper(either.right)));
// // }

// // export function eMapLeft<EResult, E, T>(
// //   mapper: (l: Left<E>) => Left<EResult>
// // ): EMapLeft<EResult, E, T> {
// //   return (either) => (isLeft(either) ? mapper(either) : either);
// // }




// export type L<T> = <E>(left: E) => Either<E, T>;

// // export function left<T>(left: T): Either<T, unknown> {
// //   return { _tag: 'Left', left } as Either<T, unknown>;
// // }
