import { Cursor } from "../zy_god/cursor";

export interface KeyPressResponse {
  cursorMoveResponse: {
    moved: boolean;
    newRelativeCursor: Cursor;
  };
}
