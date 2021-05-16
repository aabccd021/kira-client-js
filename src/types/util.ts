export type Dictionary<T> = Record<string, T>;
export type Either<T, E> = { _tag: 'right'; value: T } | { _tag: 'left'; error: E };

export type Unsubscribe = () => void;

export type Listener<T> = (newState: T) => unknown;

export type BaseState = { state: string };

export type NeverUndefined<T> = T extends undefined ? never : T;

export type Subject<T extends BaseState> = {
  get: () => T;
  set: (t: NeverUndefined<T>) => void;
  onChange: (listener: Listener<T>) => Unsubscribe;
};

export type Observable<T> = {
  initialState: T;
  onChange?: (listener: Listener<T>) => Unsubscribe;
};
