import { Dictionary } from 'kira-core';

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
