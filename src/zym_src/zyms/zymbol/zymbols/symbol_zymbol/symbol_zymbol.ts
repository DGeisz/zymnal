import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorIndex,
  FAILED_CURSOR_MOVE_RESPONSE,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { ZymbolFrame } from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  DeleteBehaviorType,
  normalDeleteBehavior,
} from "../../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../../zymbol";

class SymbolZymbolMaster extends ZyMaster {
  zyId: string = "symbol-zymbol";
}

export const symbolZymbolMaster = new SymbolZymbolMaster();

export class SymbolZymbol extends Zymbol<{}> {
  texSymbol: string;
  children: Zym<any, any, any>[] = [];
  zyMaster: ZyMaster = symbolZymbolMaster;

  constructor(
    texSymbol: string,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);
    this.texSymbol = texSymbol;
  }

  moveCursorLeft = (_cursor: Cursor) => FAILED_CURSOR_MOVE_RESPONSE;
  takeCursorFromLeft = () => FAILED_CURSOR_MOVE_RESPONSE;
  moveCursorRight = (_cursor: Cursor) => FAILED_CURSOR_MOVE_RESPONSE;
  takeCursorFromRight = () => FAILED_CURSOR_MOVE_RESPONSE;

  addCharacter = (_character: string, _cursor: Cursor) =>
    FAILED_CURSOR_MOVE_RESPONSE;

  renderTex = (opts: ZymbolRenderArgs) => this.texSymbol;

  getDeleteBehavior = () => normalDeleteBehavior(DeleteBehaviorType.ALLOWED);
  persistData(): {} {
    throw new Error("Method not implemented.");
  }

  clone(newParent?: Zym): Zym<string, any, any> {
    return new SymbolZymbol(
      this.texSymbol,
      this.parentFrame,
      this.getCursorIndex(),
      newParent ?? this.parent
    );
  }
}
