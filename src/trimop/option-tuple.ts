import { _ } from './function';
import * as O from './option';
import * as P from './tuple';
import { Option, Tuple2, Tuple3, Tuple4 } from './type';

export function map2<A, B, T>(mapper: (a: A, b: B) => T): (op: Option<Tuple2<A, B>>) => Option<T> {
  return (op) =>
    _(op)
      ._(O.map((val) => _(val)._(P.map2(mapper))._v()))
      ._v();
}

export function map3<A, B, C, T>(
  mapper: (a: A, b: B, c: C) => T
): (op: Option<Tuple3<A, B, C>>) => Option<T> {
  return (op) =>
    _(op)
      ._(O.map((val) => _(val)._(P.map3(mapper))._v()))
      ._v();
}

export function map4<A, B, C, D, T>(
  mapper: (a: A, b: B, c: C, d: D) => T
): (op: Option<Tuple4<A, B, C, D>>) => Option<T> {
  return (op) =>
    _(op)
      ._(O.map((val) => _(val)._(P.map4(mapper))._v()))
      ._v();
}
