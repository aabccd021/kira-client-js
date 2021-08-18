import * as O from './option';
import { Dict, Identity, Option } from './type';

export type DEntry<T> = readonly [string, NonNullable<T>];

export function entry<T>(key: string): (value: NonNullable<T>) => DEntry<T> {
  return (value) => [key, value];
}

export function fromEntry<T>(entries: readonly DEntry<T>[]): Dict<T> {
  return Object.fromEntries(entries);
}

export function lookup<T>(key: string): (dict: Dict<T>) => Option<T> {
  return (dict) => O.fromNullable(dict[key]);
}

export function mapEntries<TR, T>(
  mapper: (field: T, fieldName: string, index: number) => TR
): (dict: Dict<T>) => readonly TR[] {
  return (dict) =>
    Object.entries(dict).map(([fieldName, field], index) => mapper(field, fieldName, index));
}

export function filter<T>(
  mapper: (field: T, fieldName: string, index: number) => boolean
): Identity<Dict<T>> {
  return (dict) =>
    Object.fromEntries(
      Object.entries(dict).filter(([fieldName, field], index) => mapper(field, fieldName, index))
    );
}

export function mapValues<TR, T>(
  mapper: (field: T, fieldName: string, index: number) => NonNullable<TR>
): (dict: Dict<T>) => Dict<TR> {
  return (dict) =>
    Object.fromEntries(
      Object.entries(dict).map(([fieldName, field], index) => [
        fieldName,
        mapper(field, fieldName, index),
      ])
    );
}

export function reduce<TR, T>(
  initialState: TR,
  reducer: (acc: TR, value: T, key: string, index: number) => TR
): (dict: Dict<T>) => TR {
  return (dict) =>
    Object.entries(dict).reduce(
      (acc, [key, value], index) => reducer(acc, value, key, index),
      initialState
    );
}
