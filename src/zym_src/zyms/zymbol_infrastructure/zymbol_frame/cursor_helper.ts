import { removeAllChildren } from "../../../../global_utils/dom_utils";
import {
  cursorToString,
  CURSOR_NAME,
} from "../../../../global_utils/latex_utils";
import { Cursor } from "../../../../zym_lib/zy_god/cursor/cursor";

export function placeDomCursor(cursor: Cursor) {
  cursor = [...cursor];

  if (cursor.length > 1) {
    const index = cursor.pop();
    const stringId = cursorToString(cursor);

    const element = document.getElementById(stringId);

    if (!element) return;

    const range = document.createRange();
    const sel = window.getSelection();

    range.setStart(element?.childNodes[0]!, index!);
    // range.setStart(element?.childNodes[0]!, index! > 2 ? 1 : index!);
    range.collapse(true);

    sel?.removeAllRanges();
    sel?.addRange(range);
  }
}

export function clearDomCursor() {
  const sel = window.getSelection();

  if (sel) {
    sel.empty();
    sel.removeAllRanges();
  }
}

export function placeDomCursorInLatex() {
  const cursors = document.getElementsByClassName(CURSOR_NAME);

  const sel = window.getSelection();
  if (cursors.length > 0) {
    const cursor = cursors[0] as HTMLSpanElement;
    cursor.contentEditable = "true";

    removeAllChildren(cursor);

    cursor.append(document.createTextNode("\u00A0"));
    // cursor.append("d");

    const range = document.createRange();

    range.setStart(cursor?.childNodes[0]!, 0);
    // range.setStart(element?.childNodes[0]!, index! > 2 ? 1 : index!);
    range.collapse(true);

    sel?.removeAllRanges();
    sel?.addRange(range);
  } else {
    sel?.empty();
    sel?.removeAllRanges();
  }
}
