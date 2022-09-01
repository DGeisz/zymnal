import { last } from "./array_utils";

export function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function splitCursorStringWithFixedSymbols(
  str: string,
  cursor: number,
  wordSize: number
): {
  before: string;
  after: string;
  word: string;
} {
  if (cursor < wordSize) {
    return {
      before: "",
      word: str.slice(0, cursor),
      after: str.slice(cursor),
    };
  } else {
    return {
      before: str.slice(0, cursor - wordSize),
      word: str.slice(cursor - wordSize, cursor),
      after: str.slice(cursor),
    };
  }
}

export function splitCursorStringAtLastWord(
  str: string,
  cursor: number,
  splitList?: string[],
  preventBeforeAfterStringTrim?: boolean
): {
  before: string;
  after: string;
  word: string;
} {
  let after = str.slice(cursor);

  if (!preventBeforeAfterStringTrim) {
    after = after.trim();
  }

  const beforeAndWord = str.slice(0, cursor);

  const bs = beforeAndWord.split(" ");
  let word = last(bs);

  let before = beforeAndWord.slice(0, beforeAndWord.length - word.length);

  if (!preventBeforeAfterStringTrim) {
    before = before.trim();
  }

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

/* Removing j so that we have proper escape behavior */
const hintKeys = "sadfklewcmpgh".split("");

/**
 * Proudly stole this right from Vimium
 */
export function vimiumHintKeys(linkCount: number): string[] {
  let hints: string[] = [""];
  let offset: number = 0;
  while (hints.length - offset < linkCount || hints.length === 1) {
    const hint = hints[offset++];
    for (let ch of hintKeys) hints.push(ch + hint);
  }
  hints = hints.slice(offset, offset + linkCount);

  return hints.sort().map((str) => str.split("").reverse().join(""));
}

export function stringSplice(
  source: string,
  index: number,
  deleteCount: number,
  ...args: string[]
): string {
  if (index === 0) {
    return args.join("") + source.slice(index + deleteCount);
  } else {
    return (
      source.slice(0, index) + args.join("") + source.slice(index + deleteCount)
    );
  }
}
