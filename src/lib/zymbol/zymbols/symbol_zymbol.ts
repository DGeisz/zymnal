import { Cursor, FAILED_CURSOR_MOVE_RESPONSE } from "../../cursor";
import { Zocket } from "./zocket";
import { Zymbol } from "../zymbol";
import { DeleteBehavior, DeleteBehaviorType } from "../delete_behavior";

export const SYMBOL_ZYMBOL_NAME = "symbol";

export class SymbolZymbol extends Zymbol {
  texSymbol: string;

  constructor(parentSocket: Zocket, texSymbol: string) {
    super(parentSocket);
    this.texSymbol = texSymbol;
  }

  moveCursorLeft = (_cursor: Cursor) => FAILED_CURSOR_MOVE_RESPONSE;
  takeCursorFromLeft = () => FAILED_CURSOR_MOVE_RESPONSE;
  moveCursorRight = (_cursor: Cursor) => FAILED_CURSOR_MOVE_RESPONSE;
  takeCursorFromRight = () => FAILED_CURSOR_MOVE_RESPONSE;

  addCharacter = (_character: string, _cursor: Cursor) =>
    FAILED_CURSOR_MOVE_RESPONSE;
  renderTex = (_cursor: Cursor) => this.texSymbol;
  getName = () => SYMBOL_ZYMBOL_NAME;

  getDeleteBehavior = (): DeleteBehavior => ({
    type: DeleteBehaviorType.ALLOWED,
  });
}
