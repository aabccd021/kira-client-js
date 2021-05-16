export type Dictionary<T> = Record<string, T>;
export type Either<T, E> =
  | { readonly _tag: 'right'; readonly value: T }
  | { readonly _tag: 'left'; readonly error: E };

export type Unsubscribe = () => void;

export type Listener<T> = (newState: T) => unknown;

export type BaseState = { readonly state: string };

export type NeverUndefined<T> = T extends undefined ? never : T;

export type Subject<T extends BaseState> = {
  readonly get: () => T;
  readonly set: (t: NeverUndefined<T>) => void;
  readonly onChange: (listener: Listener<T>) => Unsubscribe;
};

export type Observable<T> = {
  readonly initialState: T;
  readonly onChange?: (listener: Listener<T>) => Unsubscribe;
};
