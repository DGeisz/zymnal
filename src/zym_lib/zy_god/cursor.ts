import { last } from "../../global_utils/array_utils";
import { CURSOR_NAME } from "../../global_utils/latex_utils";
import { Zym } from "../zym/zym";
import { createGodlyCommand, ZyGodCommand } from "./godly_commands";

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

export function getZymInitialCursor(zym: Zym): Cursor | undefined {
  return zym.handleZymCommand(
    createGodlyCommand(ZyGodCommand.getInitialRelativeCursor)
  );
}

export function getInitialCursor(root: Zym): Cursor {
  const rootCursor = getZymInitialCursor(root);

  if (rootCursor) {
    return extendChildCursor(0, rootCursor);
  } else if (root.children.length === 0) {
    return [];
  }

  const zymQueue: Zym[] = [root, root.children[0]];

  while (zymQueue.length < 2) {
    const curr = last(zymQueue);

    const currCursor = getZymInitialCursor(curr);

    if (currCursor) {
      return [...curr.getFullCursorPointer(), ...currCursor];
    }

    if (curr.children.length > 0) {
      zymQueue.push(curr.children[0]);
    } else {
      while (true) {
        if (zymQueue.length < 2) {
          return [];
        }

        const curr = zymQueue.pop();
        const parent = last(zymQueue);

        const newChild = parent.children[curr!.getCursorIndex() + 1];

        if (newChild) {
          zymQueue.push(newChild);
          break;
        }
      }
    }
  }

  return [];
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
  cursorIndex: CursorIndex
): CursorMoveResponse {
  return {
    success: true,
    newRelativeCursor: [cursorIndex],
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
