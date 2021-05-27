import { Dictionary } from 'kira-core';

import { Either } from './types';

export function eProps<T, E>(obj: Dictionary<Either<T, E>>): Either<Dictionary<T>, E> {
  return Object.entries(obj).reduce<Either<Dictionary<T>, E>>(
    (acc, [key, dictValue]) => {
      if (acc._tag === 'right') {
        if (dictValue._tag === 'right') {
          return {
            _tag: 'right',
            value: {
              ...acc.value,
              [key]: dictValue.value,
            },
          };
        }
        return { _tag: 'left', error: dictValue.error };
      }
      return acc;
    },

    { _tag: 'right', value: {} }
  );
}

export function ppProps<T>(obj: Dictionary<Promise<T>>): Promise<Dictionary<T>> {
  return Promise.all(
    Object.entries(obj).map(([key, val]) => val.then((v) => [key, v] as readonly [string, T]))
  ).then((entries) => Object.fromEntries(entries));
}

export function isNotNil<T>(value: T | null | undefined): value is T {
  // eslint-disable-next-line no-null/no-null
  return value !== null && value !== undefined;
}

export function mapValues<T, V>(
  obj: Dictionary<T>,
  mapper: (el: T, key: string) => V
): Dictionary<V> {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: mapper(value, key) }),
    {}
  );
}

export function pickBy<T, V extends T>(
  obj: Dictionary<T>,
  filter: (value: T) => value is V
): Dictionary<V> {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => (filter(value) ? { ...acc, [key]: value } : acc),
    {}
  );
}
