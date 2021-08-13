"use strict";
/* eslint-disable functional/immutable-data */
/* eslint-disable functional/prefer-readonly-type */
/* eslint-disable functional/no-let */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCached = void 0;
const cachedData = {};
function getCached({ key, builder, }) {
    var _a;
    const cachedValue = (_a = cachedData[key]) !== null && _a !== void 0 ? _a : builder();
    cachedData[key] = cachedValue;
    return cachedValue;
}
exports.getCached = getCached;
//# sourceMappingURL=cached.js.map