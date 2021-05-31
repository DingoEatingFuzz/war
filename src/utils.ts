import { Round } from './war'

export interface ZipDict {
  [index: string]: Array<any>
}
export interface ZipEntry {
  [index: string]: any
}

export function zip(lists:ZipDict) {
  const collections = Object.keys(lists);
  const len = lists[collections[0]].length;
  for (let key of collections) {
    if (lists[key].length !== len) {
      throw new Error(`Provided list "${key}" does not have the correct length. All collections must have the same length.`);
    }
  }
  const zipped = [];
  for (let i = 0; i < len; i++) {
    const entry:ZipEntry = {};
    for (let key of collections) {
      entry[key] = lists[key][i];
    }
    zipped.push(entry);
  }
  return zipped;
}

export function stats(rounds:Array<Round>) {
  return {
    rounds,
    count: rounds.length,
  }
}
