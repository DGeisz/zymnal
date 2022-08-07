import { last } from "./array_utils";

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function splitCursorStringAtLastWord(
  str: string,
  cursor: number,
  splitList?: string[]
): {
  before: string;
  after: string;
  word: string;
} {
  const after = str.slice(cursor).trim();
  const beforeAndWord = str.slice(0, cursor);

  const bs = beforeAndWord.split(" ");
  let word = last(bs);

  let before = beforeAndWord
    .slice(0, beforeAndWord.length - word.length)
    .trim();

  if (splitList) {
    for (const split of splitList) {
      if (word.startsWith(split)) {
        word = word.slice(split.length);
        before += split;
      }
    }
  }

  return {
    before,
    after,
    word,
  };
}

export function floatToReadableString(n: number): string {
  return n.toLocaleString(undefined, {
    maximumFractionDigits: n.toString().length,
  });
}

export function firstWord(s: string): string {
  return s.split(/\s+/).filter((t) => !!t)[0];
}
