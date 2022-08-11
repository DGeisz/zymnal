import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
} from "../../../../zym_lib/zy_god/cursor/cursor";

export function deflectMethodToChild(
  cursor: Cursor,
  method: (s: {
    childRelativeCursor: Cursor;
    nextCursorIndex: CursorIndex;
  }) => CursorMoveResponse
) {
  const { parentOfCursorElement, childRelativeCursor, nextCursorIndex } =
    extractCursorInfo(cursor);

  if (parentOfCursorElement) {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

  return method({ childRelativeCursor, nextCursorIndex });
}
