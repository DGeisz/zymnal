import { TeX } from "../../zym_src/zyms/zymbol/zymbol_types";
import {
  Cursor,
  CursorMoveResponse,
  FAILED_CURSOR_MOVE_RESPONSE,
} from "../cursor";
import { DeleteBehavior } from "./delete_behavior";

export abstract class Zymbol {
  parentZymbol: Zymbol;

  constructor(parentZymbol?: Zymbol) {
    this.parentZymbol = parentZymbol || this;
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

  abstract getTex: () => TeX;

  getRenderContent = this.getTex;
  /* This needs to be overloaded for any more complex zymbol */
  delete = (_cursor: Cursor) => FAILED_CURSOR_MOVE_RESPONSE;

  /* This needs to be overloaded if the zymbol allows deflect deletes.
  @return: Indicates whether the deflect delete was successful */
  deflectDelete = (): boolean => false;

  abstract renderTex: (cursor: Cursor) => string;
}
