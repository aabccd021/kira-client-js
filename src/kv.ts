import {
  None,
  Option,
  optionFold,
  optionFromNullable,
  optionMapSome,
  Some,
  StateController,
} from 'trimop';

import { DB, Listen, Listenable, Unsubscribe } from './type';

export function reset(dbController: StateController<DB>): undefined {
  return dbController.set({});
}

export function deleteRecord(dbController: StateController<DB>, key: string): undefined {
  const db = dbController.get();
  return optionFold<undefined, Listenable<unknown>>(
    optionFromNullable(db[key]),
    () => undefined,
    (listenable) => {
      listenable.listens.forEach((listen) => listen(None()));
      if (listenable.listens.length === 0) {
        dbController.set(Object.fromEntries(Object.entries(db).filter(([elKey]) => elKey !== key)));
      }
      return undefined;
    }
  );
}

export function getRecord<T>(db: StateController<DB>, key: string): Option<T> {
  return optionMapSome(
    optionFromNullable(db.get()[key] as Listenable<T> | undefined),
    (listenable) => listenable.state
  );
}

export function setRecord<T>(
  dbController: StateController<DB>,
  key: string,
  newValue: NonNullable<T>
): undefined {
  const db = dbController.get();
  const newListens = optionFold(
    optionFromNullable(db[key]),
    () => [],
    (listenable) => listenable.listens
  );
  newListens.forEach((listen) => listen(Some(newValue)));
  return dbController.set({
    ...db,
    [key]: {
      listens: newListens,
      state: Some(newValue),
    },
  });
}

export function subscribeToRecord<T>(
  dbController: StateController<DB>,
  key: string,
  newListen: Listen<T>
): Unsubscribe {
  const db = dbController.get();
  const listenable: Listenable<T> = optionFold(
    optionFromNullable(db[key]),
    () => ({ listens: [], state: None() }),
    (listenable) => listenable as Listenable<T>
  );
  newListen(listenable.state);
  dbController.set({
    ...db,
    [key]: {
      listens: [...listenable.listens, newListen] as readonly Listen<unknown>[],
      state: listenable.state,
    },
  });
  return () => {
    const db = dbController.get();
    return optionFold<undefined, Listenable<T>>(
      optionFromNullable(db[key] as Listenable<T> | undefined),
      () => undefined,
      (listenable) => {
        const newListens = listenable.listens.filter((listen) => listen !== newListen);
        return dbController.set(
          newListens.length === 0
            ? Object.fromEntries(Object.entries(db).filter(([elKey]) => elKey !== key))
            : {
                ...db,
                [key]: {
                  listens: newListens as readonly Listen<unknown>[],
                  state: listenable.state,
                },
              }
        );
      }
    );
  };
}
