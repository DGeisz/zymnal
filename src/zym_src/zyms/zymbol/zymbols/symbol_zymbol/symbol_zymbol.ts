import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  FAILED_CURSOR_MOVE_RESPONSE,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { BasicContext } from "../../../../../zym_lib/zy_god/types/context_types";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  DeleteBehaviorType,
  normalDeleteBehavior,
} from "../../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../../zymbol";
import { TeX } from "../../zymbol_types";

const SZP_FIELDS: {
  TEX_SYMBOL: "t";
} = {
  TEX_SYMBOL: "t",
};

export interface SymbolZymbolPersist {
  [SZP_FIELDS.TEX_SYMBOL]: TeX;
}

class SymbolZymbolMaster extends ZyMaster {
  zyId: string = "symbol-zymbol";

  newBlankChild(): Zym<any, any, any> {
    return new SymbolZymbol("", DUMMY_FRAME, 0, undefined);
  }
}

export const symbolZymbolMaster = new SymbolZymbolMaster();

export class SymbolZymbol extends Zymbol<SymbolZymbolPersist> {
  texSymbol: TeX;
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

  delete(_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

  persistData(): SymbolZymbolPersist {
    return {
      [SZP_FIELDS.TEX_SYMBOL]: this.texSymbol,
    };
  }

  hydrate = async (p: SymbolZymbolPersist): Promise<void> => {
    this.texSymbol = p[SZP_FIELDS.TEX_SYMBOL];
  };
}
