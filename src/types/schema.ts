type Dictionary<T> = Record<string, T>;

export type StringField = {
  type: 'string';
};

export type CountField = {
  type: 'count';
  countedCol: string;
  groupByRef: string;
};

export type ImageField = {
  type: 'image';
};

export type CreationTimeField = {
  type: 'creationTime';
};

export type OwnerField = {
  type: 'owner';
  syncFields?: Dictionary<true>;
};

// TODO: rename to ref, use interop
export type ReferenceField = {
  type: 'ref';
  refCol: string;
  syncFields?: Dictionary<true>;
};

// TODO: add version, e.g. 'Field_Base'
export type Field =
  | CountField
  | CreationTimeField
  | ImageField
  | OwnerField
  | ReferenceField
  | StringField;

export type Schema = {
  userCol: string;
  cols: Dictionary<Dictionary<Field>>;
};
