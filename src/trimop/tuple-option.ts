import { _ } from './function';
import * as O from './option';
import { bind2, bind3, bind4 } from './tuple';
import { Option, Tuple2, Tuple3, Tuple4 } from './type';

export function compact2<A, B>([a, t]: Tuple2<Option<A>, Option<B>>): Option<Tuple2<A, B>> {
  return _(a)
    ._(
      O.chain((prev) =>
        _(t)
          ._(O.map((t) => bind2<A, B>(() => t)(prev)))
          ._v()
      )
    )
    ._v();
}

export function compact3<A, B, C>([a, b, t]: Tuple3<Option<A>, Option<B>, Option<C>>): Option<
  Tuple3<A, B, C>
> {
  return _(compact2([a, b]))
    ._(
      O.chain((prev) =>
        _(t)
          ._(O.map((t) => bind3<A, B, C>(() => t)(prev)))
          ._v()
      )
    )
    ._v();
}

export function compact4<A, B, C, D>([a, b, c, t]: Tuple4<
  Option<A>,
  Option<B>,
  Option<C>,
  Option<D>
>): Option<Tuple4<A, B, C, D>> {
  return _(compact3([a, b, c]))
    ._(
      O.chain((prev) =>
        _(t)
          ._(O.map((t) => bind4<A, B, C, D>(() => t)(prev)))
          ._v()
      )
    )
    ._v();
}
