import { Cursor } from "../../../../../zym_lib/zy_god/cursor/cursor";
import { Zymbol } from "../../../zymbol/zymbol";
import {
  TextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../../../zymbol/zymbols/text_zymbol/text_zymbol";

/**
 * Basically just gets us to an assumed text zymbol and the parent */
export function getTransformTextZymbolAndParent(
  root: Zymbol,
  cursor: Cursor
):
  | { isTextZymbol: false }
  | { isTextZymbol: true; text: TextZymbol; parent: Zymbol } {
  let currZymbol = root;
  let parent = root;

  for (let i = 0; i < cursor.length - 1; i++) {
    parent = currZymbol;
    currZymbol = parent.children[cursor[i]] as Zymbol;

    if (!currZymbol) {
      return { isTextZymbol: false };
    }
  }

  if (currZymbol.getMasterId() === TEXT_ZYMBOL_NAME) {
    return { isTextZymbol: true, text: currZymbol as TextZymbol, parent };
  } else {
    return { isTextZymbol: false };
  }
}
