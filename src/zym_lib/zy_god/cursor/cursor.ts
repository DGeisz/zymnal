import { CURSOR_NAME } from "../../../global_utils/latex_utils";
import { Zym } from "../../zym/zym";
import { NONE, some, ZyOption } from "../../zy_commands/zy_command_types";

export type CursorIndex = number;
export type Cursor = CursorIndex[];

export function extendChildCursor(
  newCursorIndex: CursorIndex,
  oldCursor: Cursor
): Cursor {
  return [newCursorIndex, ...oldCursor];
}

export function extendParentCursor(
  childCursorIndex: CursorIndex,
  parentCursor: Cursor
): Cursor {
  return [...parentCursor, childCursorIndex];
}

export function getZymAtCursor(root: Zym, cursor: Cursor): ZyOption<Zym> {
  let curr = root;

  for (const i of cursor) {
    curr = curr.children[i];

    if (!curr) {
      return NONE;
    }
  }

  return some(curr);
}

const BLINK_INTERVAL = 530;

interface CursorInfo {
  /* Indicates whether the current zocket is the parent of the cursor element */
  parentOfCursorElement: boolean;
  /* This will be the next index in the cursor, and = -1 if the cursor doesn't have any more elements */
  nextCursorIndex: number;
  /* If this isn't the parent, this is the relative cursor to pass onto the child */
  childRelativeCursor: Cursor;
}

export interface CursorMoveResponse {
  success: boolean;
  newRelativeCursor: Cursor;
}

export const FAILED_CURSOR_MOVE_RESPONSE: CursorMoveResponse = {
  success: false,
  newRelativeCursor: [],
};

export function chainMoveResponse(
  moveResponse: CursorMoveResponse,
  onSuccess: (newRelativeCursor: Cursor) => CursorMoveResponse
) {
  if (moveResponse.success) {
    return onSuccess(moveResponse.newRelativeCursor);
  } else {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }
}

export function extractCursorInfo(cursor: Cursor): CursorInfo {
  if (cursor.length === 1) {
    return {
      parentOfCursorElement: true,
      nextCursorIndex: cursor[0],
      childRelativeCursor: [],
    };
  } else {
    return {
      parentOfCursorElement: false,
      nextCursorIndex: cursor.length > 0 ? cursor[0] : -1,
      childRelativeCursor: cursor.slice(1),
    };
  }
}

export function wrapChildCursorResponse(
  res: CursorMoveResponse,
  cursorIndex: CursorIndex
): CursorMoveResponse {
  if (res.success) {
    return {
      success: true,
      newRelativeCursor: [cursorIndex, ...res.newRelativeCursor],
    };
  } else {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }
}

export function successfulMoveResponse(
  cursorIndex: CursorIndex | Cursor
): CursorMoveResponse {
  return {
    success: true,
    newRelativeCursor:
      typeof cursorIndex === "number" ? [cursorIndex] : cursorIndex,
  };
}

class CursorBlink {
  blinkInterval: NodeJS.Timer;
  cursorVisible: boolean = true;

  constructor() {
    this.blinkInterval = this.genInterval();
  }

  private genInterval = () => setInterval(this.blink, BLINK_INTERVAL);

  restartTimer() {
    clearInterval(this.blinkInterval);
    this.cursorVisible = true;
    this.setDOMCursorVisibility();

    this.blinkInterval = this.genInterval();
  }

  private blink = () => {
    this.cursorVisible = !this.cursorVisible;
    this.setDOMCursorVisibility();
  };

  private setDOMCursorVisibility() {
    const cursor = document.getElementById(CURSOR_NAME);

    if (cursor) {
      cursor.style.visibility = this.cursorVisible ? "visible" : "hidden";
    }
  }
}

export const cursorBlink = new CursorBlink();
