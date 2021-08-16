/* eslint-disable functional/immutable-data */
/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/no-let */

import { Spec } from 'kira-core';
import { BuildDraft, getTrigger, Trigger } from 'kira-nosql';
import { getStateController, None, Option, Some } from 'trimop';

import { _, doEffect, oToSome } from './trimop/pipe';
import { Unsubscribe } from './type';

const cachedTrigger = getStateController<Option<Trigger>>(None());

export function init(): Unsubscribe {
  return () => {
    cachedTrigger.set(None());
  };
}

export function getCachedTrigger({
  buildDraft,
  spec,
}: {
  readonly buildDraft: BuildDraft;
  readonly spec: Spec;
}): Trigger {
  return _(cachedTrigger.get())
    ._(oToSome(() => getTrigger({ buildDraft, spec })))
    ._(
      doEffect((trigger) => {
        cachedTrigger.set(Some(trigger));
      })
    )
    ._val();
}
