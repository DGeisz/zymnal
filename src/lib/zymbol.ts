import {
  Cursor,
  CursorMoveResponse,
  FAILED_CURSOR_MOVE_RESPONSE,
} from "./cursor";
import { Zocket } from "./zocket";

export enum DeleteBehavior {
  /* Absorbs the cursor into this zymbol, handles delete from inside */
  ABSORB,
  /* Can't delete the zymbol from the current cursor position */
  FORBIDDEN,
  /* We can simply delete this zymbol like any character */
  ALLOWED,
  /* Indicates that a delete can be allowed with confirmation */
  UNPRIMED,
  /* Indicates that confirmation has been granted, we're ready to proceed with the delete
  (prime gets cleared on render by default) */
  PRIMED,
}

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

  abstract getDeleteBehavior: () => DeleteBehavior;

  primeDelete = () => {};

  /* This needs to be overloaded for any more complex zymbol */
  delete = (cursor: Cursor) => FAILED_CURSOR_MOVE_RESPONSE;

  abstract renderTex: (cursor: Cursor) => string;
}
