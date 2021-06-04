import { FieldOf, Schema } from 'kira-core';

import { OCRDocField } from './data';
import { AuthError } from './error';

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

export type OcToOcrDocField<S extends Schema, E> = (args: {
  readonly field: FieldOf<S>;
  readonly id: string;
  readonly fieldName: string;
  readonly fieldValue: unknown;
  readonly colName: string;
}) => Promise<Either<OCRDocField, E | AuthError>>;
