import { last } from "../../../../../global_utils/array_utils";
import { backslash } from "../../../../../global_utils/latex_utils";
import {
  Cursor,
  CursorIndex,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { Zymbol } from "../../../zymbol/zymbol";
import { isSymbolZymbol } from "../../../zymbol/zymbols/symbol_zymbol/symbol_zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zymbol/zymbols/text_zymbol/text_zymbol";
import { ZOCKET_MASTER_ID } from "../../../zymbol/zymbols/zocket/zocket";

/**
 * Basically just gets us to an assumed text zymbol and the parent */
export function getTransformTextZymbolAndParent(
  root: Zymbol,
  cursor: Cursor
):
  | { isTextZymbol: false }
  | {
      isTextZymbol: true;
      text: TextZymbol;
      parent: Zymbol;
      zymbolIndex: CursorIndex;
    } {
  let currZymbol = root;
  let parent = root;

  for (let i = 0; i < cursor.length - 1; i++) {
    parent = currZymbol;
    currZymbol = parent.children[cursor[i]] as Zymbol;

    if (!currZymbol) {
      return { isTextZymbol: false };
    }
  }

  /* Hey there */
  if (currZymbol.getMasterId() === TEXT_ZYMBOL_NAME) {
    return {
      isTextZymbol: true,
      text: currZymbol as TextZymbol,
      parent,
      zymbolIndex: cursor[cursor.length - 2],
    };
  } else {
    return { isTextZymbol: false };
  }
}

/* 
This places the cursor at the end of a text zymbol, which
technically isn't allowed, but drastically simplifies creating 
transformers 
*/
export function makeHelperCursor(cursor: Cursor, root: Zymbol): Cursor {
  let currZymbol = root;
  let parent = root;

  for (let i = 0; i < cursor.length; i++) {
    parent = currZymbol;
    currZymbol = parent.children[cursor[i]] as Zymbol;

    if (!currZymbol) {
      break;
    }
  }

  const zymIndex = last(cursor);

  if (parent.getMasterId() === ZOCKET_MASTER_ID && zymIndex > 0) {
    const prev = parent.children[zymIndex - 1];

    if (prev.getMasterId() === TEXT_ZYMBOL_NAME) {
      const text = prev as TextZymbol;
      const copy = [...cursor];
      copy.pop();
      copy.push(zymIndex - 1, text.getCharacters().length);

      return copy;
    }
  }

  return cursor;
}

/* Takes a potentially incorrectly placed 
cursor and recovers an allowed cursor */
export function recoverAllowedCursor(cursor: Cursor, root: Zymbol): Cursor {
  let currZymbol = root;
  let parent = root;

  for (let i = 0; i < cursor.length - 1; i++) {
    parent = currZymbol;
    currZymbol = parent.children[cursor[i]] as Zymbol;

    if (!currZymbol) {
      return cursor;
    }
  }

  const charIndex = last(cursor);

  if (
    currZymbol.getMasterId() === TEXT_ZYMBOL_NAME &&
    (currZymbol as TextZymbol).getCharacters().length === charIndex
  ) {
    const copy = [...cursor];

    copy.splice(cursor.length - 2, 2, last(cursor, 2) + 1);

    return copy;
  }

  return cursor;
}

/* TODO: Replace this with something more official!! */
export const binaryOperatorTeX = [
  "+",
  "=",
  "-",
  ...["cdot", "div", "times", "pm"].map((x) => `\\${x}`),
];

export function zymbolIsBinaryOperator(zymbol: Zymbol): boolean {
  return isSymbolZymbol(zymbol) && binaryOperatorTeX.includes(zymbol.texSymbol);
}

let integralList = [];

for (let i = 0; i < 3; i++) {
  let prefix = "";
  for (let j = 1; j < i + 1; j++) {
    prefix += "i";
  }

  integralList.push(`${prefix}nt`);
  integralList.push(`o${prefix}nt`);
}

export const operatorListKeys = [...integralList, "sum", "prod"];

export const operatorList = operatorListKeys.map(backslash);
