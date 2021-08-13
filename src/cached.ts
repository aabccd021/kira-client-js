/* eslint-disable functional/immutable-data */
/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/no-let */

import { Trigger } from 'kira-nosql';

type CachedData = {
  trigger: Trigger;
};

const cachedData: { [T in keyof CachedData]?: CachedData[T] } = {};

export function getCached<N extends keyof CachedData>({
  key,
  builder,
}: {
  readonly builder: () => CachedData[N];
  readonly key: N;
}): CachedData[N] {
  const cachedValue = cachedData[key] ?? builder();
  cachedData[key] = cachedValue;
  return cachedValue as CachedData[N];
}
