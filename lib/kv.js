"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToRecord = exports.setRecord = exports.getRecord = exports.deleteRecord = exports.reset = void 0;
const trimop_1 = require("trimop");
function reset(dbController) {
    return dbController.set({});
}
exports.reset = reset;
function deleteRecord(dbController, key) {
    const db = dbController.get();
    return trimop_1.optionFold(trimop_1.optionFromNullable(db[key]), () => undefined, (listenable) => {
        listenable.listens.forEach((listen) => listen(trimop_1.None()));
        if (listenable.listens.length === 0) {
            dbController.set(Object.fromEntries(Object.entries(db).filter(([elKey]) => elKey !== key)));
        }
        return undefined;
    });
}
exports.deleteRecord = deleteRecord;
function getRecord(db, key) {
    return trimop_1.optionFromNullable(db.get()[key]);
}
exports.getRecord = getRecord;
function setRecord(dbController, key, newValue) {
    const db = dbController.get();
    const newListens = trimop_1.optionFold(trimop_1.optionFromNullable(db[key]), () => [], (listenable) => listenable.listens);
    newListens.forEach((listen) => listen(newValue));
    return dbController.set(Object.assign(Object.assign({}, db), { [key]: {
            listens: newListens,
            state: newValue,
        } }));
}
exports.setRecord = setRecord;
function subscribeToRecord(dbController, key, newListen) {
    const db = dbController.get();
    const listenable = trimop_1.optionFold(trimop_1.optionFromNullable(db[key]), () => ({ listens: [], state: trimop_1.None() }), (listenable) => listenable);
    newListen(listenable.state);
    dbController.set(Object.assign(Object.assign({}, db), { [key]: {
            listens: [...listenable.listens, newListen],
            state: listenable.state,
        } }));
    return () => {
        const db = dbController.get();
        return trimop_1.optionFold(trimop_1.optionFromNullable(db[key]), () => undefined, (listenable) => {
            const newListens = listenable.listens.filter((listen) => listen !== newListen);
            return dbController.set(newListens.length === 0
                ? Object.fromEntries(Object.entries(db).filter(([elKey]) => elKey !== key))
                : Object.assign(Object.assign({}, db), { [key]: {
                        listens: newListens,
                        state: listenable.state,
                    } }));
        });
    };
}
exports.subscribeToRecord = subscribeToRecord;
//# sourceMappingURL=kv.js.map