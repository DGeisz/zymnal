export type CursorIndex = number;
export type Cursor = CursorIndex[];

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
