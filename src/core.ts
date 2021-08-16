import { Doc, DocSnapshot } from 'kira-core';

export function docSnapshot(id: string): (doc: Doc) => DocSnapshot {
  return (doc) => ({ doc, id });
}
