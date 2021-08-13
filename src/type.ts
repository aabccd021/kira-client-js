import { Field, ImageFieldSpec, RefFieldSpec, StringFieldSpec } from 'kira-core';
import { Dict, Either, Left } from 'trimop';

/**
 *
 */
export type ImageRField = {
  readonly url: string;
};

/**
 *
 */
export type RefRField = {
  readonly _id: string;
  // eslint-disable-next-line no-use-before-define
} & RDoc;

/**
 *
 */
export type RField = string | number | readonly string[] | Date | ImageRField | RefRField;

/**
 *
 */
export type RDoc = Dict<RField>;

/**
 *
 */
export type StringCField = string;

/**
 *
 */
export type ImageCField = File | string;

/**
 *
 */
export type RefCField = RefRField;

/**
 *
 */
export type CField = StringCField | ImageCField | RefCField;

/**
 *
 */
export type CDoc = Dict<CField>;

/**
 *
 */
export type CFieldSpec = ImageFieldSpec | StringFieldSpec | RefFieldSpec;

/**
 *
 */
export type CToFieldContext = {
  readonly col: string;
  readonly field: CField | undefined;
  readonly fieldName: string;
  readonly id: string;
};

/**
 *
 */
export type CToField<E> = (param: {
  readonly context: CToFieldContext;
  readonly fieldSpec: CFieldSpec;
}) => Promise<Either<E, Field | undefined>>;

/**
 *
 */
export type QueryKey = {
  readonly limit?: number;
  readonly orderByField?: string;
  readonly orderDirection?: 'asc' | 'desc';
};

/**
 *
 */
export type AuthContext =
  | {
      readonly id: string;
      readonly state: 'signedIn';
    }
  | {
      readonly state: 'signedOut';
    };

/**
 *
 */
export type KeyIsEmptyDocState = {
  readonly state: 'KeyIsEmpty';
};

export function KeyIsEmptyDocState(): KeyIsEmptyDocState {
  return { state: 'KeyIsEmpty' };
}

/**
 *
 */
export type InitializingDocState = {
  readonly state: 'Initializing';
};

export function InitializingDocState(): InitializingDocState {
  return { state: 'Initializing' };
}

/**
 *
 */
export type ContainsErrorDocState<E> = {
  readonly error: Left<E>;
  readonly refresh: () => void;
  readonly state: 'ContainsError';
};

export function ContainsErrorDocState<E>(
  p: Omit<ContainsErrorDocState<E>, 'state'>
): ContainsErrorDocState<E> {
  return { ...p, state: 'ContainsError' };
}

/**
 *
 */
export type NotExistsDocState<C extends CDoc> = {
  readonly create: (ocDocData: C) => void;
  readonly state: 'NotExists';
};

export function NotExistsDocState<C extends CDoc>(
  p: Omit<NotExistsDocState<C>, 'state'>
): NotExistsDocState<C> {
  return { ...p, state: 'NotExists' };
}

/**
 *
 */
export type CreatingDocState = {
  readonly refresh: () => void;
  readonly state: 'Creating';
};

export function CreatingDocState(p: Omit<CreatingDocState, 'state'>): CreatingDocState {
  return { ...p, state: 'Creating' };
}

/**
 *
 */
export type ReadyDocState<R extends RDoc> = R & {
  readonly _id: string;
  readonly state: 'Ready';
};

export function ReadyDocState<R extends RDoc>(
  p: Omit<ReadyDocState<R>, 'state'>
): ReadyDocState<R> {
  return { ...p, state: 'Ready' } as ReadyDocState<R>;
}

/**
 *
 */
export type DocState<E, R extends RDoc = RDoc, C extends CDoc = CDoc> =
  | KeyIsEmptyDocState
  | InitializingDocState
  | ContainsErrorDocState<E>
  | NotExistsDocState<C>
  | CreatingDocState
  | ReadyDocState<R>;
