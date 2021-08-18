/* eslint-disable functional/immutable-data */
/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/no-let */

import { Spec } from 'kira-core';
import { BuildDraft, getTrigger, Trigger } from 'kira-nosql';
import { getStateController, None, Option, Some } from 'trimop';

import { Unsubscribe } from './type';
import * as D from '../trimop/dict';
import * as E from '../trimop/either';
import { _, flow } from '../trimop/function';
import * as O from '../trimop/option';
import * as OE from '../trimop/option-either';
import * as OP from '../trimop/option-tuple';
import * as T from '../trimop/task';
import * as TE from '../trimop/task-either';
import * as P from '../trimop/tuple';
import * as PO from '../trimop/tuple-option';
i

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
    ._(O.getOrElse(() => getTrigger({ buildDraft, spec })))
    ._(
      doEffect((trigger) => {
        cachedTrigger.set(Some(trigger));
      })
    )
    ._v();
}
