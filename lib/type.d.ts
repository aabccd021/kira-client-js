import { Doc, Field, ImageFieldSpec, RefFieldSpec, StringFieldSpec } from 'kira-core';
import { Dict, Either, Left, Option } from 'trimop';
/**
 *
 */
export declare type Listen<T> = (value: Option<T>) => undefined;
/**
 *
 */
export declare type Unsubscribe = () => undefined;
/**
 *
 */
export declare type Listenable<T> = {
    readonly listens: readonly Listen<T>[];
    readonly state: Option<T>;
};
/**
 *
 */
export declare type DB = Dict<Listenable<unknown>>;
/**
 *
 */
export declare type InvalidKeyError = {
    readonly key: string;
};
/**
 *
 */
export declare type ImageRField = {
    readonly url: string;
};
/**
 *
 */
export declare type RefRField = {
    readonly _id: string;
} & RDoc;
/**
 *
 */
export declare type RField = string | number | readonly string[] | Date | ImageRField | RefRField;
/**
 *
 */
export declare type RDoc = Dict<RField>;
/**
 *
 */
export declare type RToDoc = (doc: RDoc) => Doc;
/**
 *
 */
export declare type DocToR = (doc: Doc) => RDoc;
/**
 *
 */
export declare type StringCField = string;
/**
 *
 */
export declare type ImageCField = File | string;
/**
 *
 */
export declare type RefCField = RefRField;
/**
 *
 */
export declare type CField = StringCField | ImageCField | RefCField;
/**
 *
 */
export declare type CDoc = Dict<CField>;
/**
 *
 */
export declare type CFieldSpec = ImageFieldSpec | StringFieldSpec | RefFieldSpec;
/**
 *
 */
export declare type CToFieldContext = {
    readonly col: string;
    readonly field: CField | undefined;
    readonly fieldName: string;
    readonly id: string;
};
/**
 *
 */
export declare type CToField<E> = (param: {
    readonly context: CToFieldContext;
    readonly fieldSpec: CFieldSpec;
}) => Promise<Either<E, Field | undefined>>;
/**
 *
 */
export declare type QueryKey = {
    readonly limit?: number;
    readonly orderByField?: string;
    readonly orderDirection?: 'asc' | 'desc';
};
/**
 *
 */
export declare type AuthContext = {
    readonly id: string;
    readonly state: 'signedIn';
} | {
    readonly state: 'signedOut';
};
/**
 *
 */
export declare type KeyIsEmptyDocState = {
    readonly state: 'KeyIsEmpty';
};
export declare function KeyIsEmptyDocState(): KeyIsEmptyDocState;
/**
 *
 */
export declare type InitializingDocState = {
    readonly state: 'Initializing';
};
export declare function InitializingDocState(): InitializingDocState;
/**
 *
 */
export declare type ContainsErrorDocState<E> = {
    readonly error: Left<E>;
    readonly refresh: () => void;
    readonly state: 'ContainsError';
};
export declare function ContainsErrorDocState<E>(p: Omit<ContainsErrorDocState<E>, 'state'>): ContainsErrorDocState<E>;
/**
 *
 */
export declare type NotExistsDocState<C extends CDoc> = {
    readonly create: (ocDocData: C) => void;
    readonly state: 'NotExists';
};
export declare function NotExistsDocState<C extends CDoc>(p: Omit<NotExistsDocState<C>, 'state'>): NotExistsDocState<C>;
/**
 *
 */
export declare type CreatingDocState = {
    readonly refresh: () => void;
    readonly state: 'Creating';
};
export declare function CreatingDocState(p: Omit<CreatingDocState, 'state'>): CreatingDocState;
/**
 *
 */
export declare type ReadyDocState<R extends RDoc> = {
    readonly data: R;
    readonly id: string;
    readonly state: 'Ready';
};
export declare function ReadyDocState<R extends RDoc>(p: Omit<ReadyDocState<R>, 'state'>): ReadyDocState<R>;
/**
 *
 */
export declare type DocState<E, R extends RDoc = RDoc, C extends CDoc = CDoc> = {
    readonly state: string;
} & (ContainsErrorDocState<E> | CreatingDocState | InitializingDocState | KeyIsEmptyDocState | NotExistsDocState<C> | ReadyDocState<R>);
//# sourceMappingURL=type.d.ts.map