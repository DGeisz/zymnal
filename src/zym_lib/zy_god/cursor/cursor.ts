import { CURSOR_NAME } from "../../../global_utils/latex_utils";
import { Zym } from "../../zym/zym";
import { NONE, zySome, ZyOption } from "../../utils/zy_option";
import { createContextVariable } from "../../utils/basic_context";
import { ZyId } from "../../zy_schema/zy_schema";
import { useState } from "react";

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

export async function cursorForEach(
  root: Zym<any, any>,
  cursor: Cursor,
  fn: (zym: Zym<any, any>) => Promise<void> | void
) {
  let currZym = root;

  for (const i of cursor) {
    if (!currZym) return;

    await fn(currZym);

    currZym = currZym.children[i];
  }
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

export const NO_CURSOR_MOVE_RESPONSE = FAILED_CURSOR_MOVE_RESPONSE;

export function chainMoveResponse(
  moveResponse: CursorMoveResponse,
  onSuccess: (newRelativeCursor: Cursor) => CursorMoveResponse
): CursorMoveResponse {
  if (moveResponse.success) {
    return onSuccess(moveResponse.newRelativeCursor);
  } else {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }
}

export function getCursorToFirstZymId(
  root: Zym,
  cursor: Cursor,
  zyId: ZyId
): Cursor {
  let currZym = root;
  cursor = [...cursor];
  const finalCursor = [];

  while (cursor.length > 0) {
    const i = cursor.shift()!;
    finalCursor.push(i);

    const child = currZym.children[i];

    if (!child) return [];

    if (child.getMasterId() === zyId) return finalCursor;

    currZym = child;
  }

  return [];
}

export function getRemainingCursorAfterZymId(
  root: Zym,
  cursor: Cursor,
  zyId: ZyId
): Cursor {
  let currZym = root;
  cursor = [...cursor];

  while (cursor.length > 0) {
    const i = cursor.shift()!;

    const child = currZym.children[i];

    if (!child) return [];

    if (child.getMasterId() === zyId) return cursor;

    currZym = child;
  }

  return [];
}

export function getLastZymInCursorWithId<Z extends Zym>(
  root: Zym,
  cursor: Cursor,
  id: ZyId
): ZyOption<{ zym: Z; childRelativeCursor: Cursor }> {
  const cursorZym = [root];

  let currZym = root;

  for (const i of cursor) {
    currZym = currZym.children[i];
    if (currZym === undefined) break;

    cursorZym.push(currZym);
  }

  const lastZymI = cursorZym.reverse().findIndex((z) => z.getMasterId() === id);

  if (lastZymI > -1) {
    const lastZym = cursorZym[lastZymI];

    return zySome({
      zym: lastZym as Z,
      childRelativeCursor: cursor.slice(cursorZym.length - 1 - lastZymI),
    });
  } else {
    return NONE;
  }
}

export function getAllZymWithId<Z extends Zym>(
  root: Zym,
  cursor: Cursor,
  id: ZyId
): Z[] {
  const allZ: Z[] = [];
  let currZym = root;

  for (const i of cursor) {
    if (currZym.getMasterId() === id) {
      allZ.push(currZym as Z);
    }

    currZym = currZym.children[i];
    if (currZym === undefined) break;
  }

  return allZ;
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
  res: CursorMoveResponse | undefined,
  cursorIndex: CursorIndex
): CursorMoveResponse {
  if (res && res.success) {
    return {
      success: true,
      newRelativeCursor: [cursorIndex, ...res.newRelativeCursor],
    };
  } else {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }
}

export function getZymAtId(root: Zym, cursor: Cursor): Zym | undefined {
  let currZym = root;

  for (const i of cursor) {
    currZym = currZym.children[i];

    if (!currZym) {
      return undefined;
    }
  }

  return currZym;
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

export function getRelativeCursor(
  zymCursor: Cursor,
  fullCursor: Cursor
): ZyOption<Cursor> {
  if (zymCursor.length > fullCursor.length) return NONE;

  for (let i = 0; i < zymCursor.length; i++) {
    if (fullCursor[i] !== zymCursor[i]) {
      return NONE;
    }
  }

  return zySome(fullCursor.slice(zymCursor.length));
}

export enum CursorMode {
  Basic,
  /* Cursor that covers the full term that it encapsulates */
  FullCover,
}

export const { get: getCursorMode, set: setCursorMode } =
  createContextVariable<CursorMode>("cursor-mode");

class CursorBlink {
  blinkInterval: NodeJS.Timer;
  cursorVisible: boolean = true;

  private preventCursorBlink = false;

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

  setPreventCursorBlink = (preventCursorBlink: boolean) => {
    if (preventCursorBlink) {
      const cursors = document.getElementsByClassName(CURSOR_NAME);

      for (const cursor of cursors) {
        (cursor as HTMLDivElement).style.visibility = "visible";
      }
    }

    this.preventCursorBlink = preventCursorBlink;
  };

  private blink = () => {
    this.cursorVisible = !this.cursorVisible;
    this.setDOMCursorVisibility();
  };

  private setDOMCursorVisibility() {
    if (!this.preventCursorBlink) {
      const cursors = document.getElementsByClassName(CURSOR_NAME);

      for (const cursor of cursors) {
        (cursor as HTMLDivElement).style.visibility = this.cursorVisible
          ? "visible"
          : "hidden";
      }
    }
  }
}

export const cursorBlink = new CursorBlink();
