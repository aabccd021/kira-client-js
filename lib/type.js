"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadyDocState = exports.CreatingDocState = exports.NotExistsDocState = exports.ContainsErrorDocState = exports.InitializingDocState = exports.KeyIsEmptyDocState = void 0;
function KeyIsEmptyDocState() {
    return { state: 'KeyIsEmpty' };
}
exports.KeyIsEmptyDocState = KeyIsEmptyDocState;
function InitializingDocState() {
    return { state: 'Initializing' };
}
exports.InitializingDocState = InitializingDocState;
function ContainsErrorDocState(p) {
    return Object.assign(Object.assign({}, p), { state: 'ContainsError' });
}
exports.ContainsErrorDocState = ContainsErrorDocState;
function NotExistsDocState(p) {
    return Object.assign(Object.assign({}, p), { state: 'NotExists' });
}
exports.NotExistsDocState = NotExistsDocState;
function CreatingDocState(p) {
    return Object.assign(Object.assign({}, p), { state: 'Creating' });
}
exports.CreatingDocState = CreatingDocState;
function ReadyDocState(p) {
    return Object.assign(Object.assign({}, p), { state: 'Ready' });
}
exports.ReadyDocState = ReadyDocState;
//# sourceMappingURL=type.js.map