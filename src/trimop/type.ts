export type Task<T> = () => Promise<T>;

export function Task<T>(t: T): Task<T> {
  return () => Promise.resolve(t);
}

/**
 * Right
 */
export type Right<T> = {
  readonly _tag: 'Right';
  readonly right: T;
};

/**
 * Left
 */
export type Left<E> = {
  readonly _tag: 'Left';
  readonly errorObject: Error;
  readonly left: E;
};

export function Right<T>(right: T): Right<T> {
  return { _tag: 'Right', right };
}

export function Left<F>(left: F): Left<F> {
  return {
    _tag: 'Left',
    errorObject: new Error(),
    left,
  };
}

/**
 * Either
 * TODO: Result<Ok, Err>
 */
export type Either<E, V> = Left<E> | Right<V>;

export type TaskRight<T> = Task<Right<T>>;

export function TaskRight<T>(t: T): TaskRight<T> {
  return Task(Right(t));
}

/**
 * None
 */
export declare type None = {
  readonly _tag: 'None';
};

/**
 * Some
 */
export declare type Some<T> = {
  readonly _tag: 'Some';
  readonly value: T;
};

/**
 * Option
 */
export type Option<T> = None | Some<T>;

/**
 *
 */
export type Identity<T> = (t: T) => T;

// eslint-disable-next-line functional/prefer-type-literal
export interface Dict<T> {
  readonly [index: string]: NonNullable<T>;
}

export type Tuple2<A, B> = readonly [A, B];
export type Tuple3<A, B, C> = readonly [A, B, C];
export type Tuple4<A, B, C, D> = readonly [A, B, C, D];
