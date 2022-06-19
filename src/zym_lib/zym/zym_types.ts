import { Cursor } from "../zy_god/cursor";

interface CursorMoveResponse {
  moved: boolean;
  newRelativeCursor: Cursor;
}

export interface KeyPressResponse {
  cursorMoveResponse: CursorMoveResponse;
}

export const FAILED_KEY_PRESS_RESPONSE: KeyPressResponse = {
  cursorMoveResponse: {
    moved: false,
    newRelativeCursor: [],
  },
};

export function keyPressResponseFromCursorMoveResponse(
  cursorMoveResponse: CursorMoveResponse
): KeyPressResponse {
  return {
    cursorMoveResponse,
  };
}
