import { Cursor, CursorMoveResponse } from "./cursor";
import { Zocket } from "./zocket";

export abstract class Zymbol {
  parentZocket: Zocket;

  constructor(parentZocket: Zocket) {
    this.parentZocket = parentZocket;
  }

  abstract getName: () => string;

  abstract moveCursorLeft: (cursor: Cursor) => CursorMoveResponse;
  abstract takeCursorFromLeft: () => CursorMoveResponse;

  abstract moveCursorRight: (cursor: Cursor) => CursorMoveResponse;
  abstract takeCursorFromRight: () => CursorMoveResponse;

  abstract addCharacter: (
    character: string,
    cursor: Cursor
  ) => CursorMoveResponse;

  abstract renderTex: (cursor: Cursor) => string;
}
