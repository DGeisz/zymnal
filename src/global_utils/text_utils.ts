import { last } from "./array_utils";

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function splitCursorStringAtLastWord(
  str: string,
  cursor: number
): {
  before: string;
  after: string;
  word: string;
} {
  const after = str.slice(cursor).trim();
  const beforeAndWord = str.slice(0, cursor);

  const bs = beforeAndWord.split(" ");
  const word = last(bs);

  const before = beforeAndWord
    .slice(0, beforeAndWord.length - word.length)
    .trim();

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
