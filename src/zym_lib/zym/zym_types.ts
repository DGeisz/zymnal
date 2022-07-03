import { Cursor } from "../zy_god/cursor/cursor";
import { ZyId } from "../zy_types/basic_types";

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

/* Zym tree messages passing */
type TreeCommandType = string;

export interface TreeCommand {
  /* Used for identifying source of message */
  zyMasterId: ZyId;
  type: TreeCommandType;
  content: any;
}

/* Zym commands */
export interface ZymCommand {
  zyMasterId: ZyId;
  type: TreeCommandType;
  content: any;
}

export type ZymCommandResponse = any;