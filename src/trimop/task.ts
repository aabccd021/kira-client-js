import * as y from './type';

export type ToTask<T> = (t: T) => y.Task<T>;

/**
 *
 * @param t
 * @returns
 */
export function task<T>(t: T): y.Task<T> {
  return () => Promise.resolve(t);
}

/**
 *
 * @param p
 * @returns
 */
export function fromPromise<T>(p: Promise<T>): y.Task<T> {
  return () => p;
}

/**
 *
 */
export type Maps<TResult, T> = (t: y.Task<T>) => y.Task<TResult>;

/**
 *
 * @param mapper
 * @returns
 */
export function map<TResult, T>(mapper: (t: T) => TResult): Maps<TResult, T> {
  return (task) => () => task().then(mapper);
}

/**
 *
 * @param tasks
 * @returns
 */
export function parallel<T>(tasks: readonly y.Task<T>[]): y.Task<readonly T[]> {
  return () => Promise.all(tasks.map((task) => task()));
}

// export function doEffect<T>(effect: (t: T) => void): Identity<Task<T>> {
//   return (t) => () =>
//     tDo(t).then((res) => {
//       effect(res);
//       return res;
//     });
// }
/**
 *
 * @param e
 * @returns
 */
export function flatten<T>(e: y.Task<y.Task<T>>): y.Task<T> {
  return () => e().then((r) => r());
}
