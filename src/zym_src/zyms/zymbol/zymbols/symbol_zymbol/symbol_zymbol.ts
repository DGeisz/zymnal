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
import { extendZymbol } from "../../zymbol_cmd";
import { TeX } from "../../zymbol_types";
import { ZymbolModifier } from "../zocket/zocket";

const SZP_FIELDS: {
  TEX_SYMBOL: "t";
  MODIFIERS: "m";
} = {
  TEX_SYMBOL: "t",
  MODIFIERS: "m",
};

export interface SymbolZymbolPersist {
  [SZP_FIELDS.TEX_SYMBOL]: TeX;
  [SZP_FIELDS.MODIFIERS]: ZymbolModifier[];
}

class SymbolZymbolMaster extends ZyMaster {
  zyId: string = "symbol-zymbol";

  newBlankChild(): Zym<any, any, any> {
    return new SymbolZymbol("", DUMMY_FRAME, 0, undefined);
  }
}

export const symbolZymbolMaster = new SymbolZymbolMaster();

extendZymbol(symbolZymbolMaster);

export class SymbolZymbol extends Zymbol<SymbolZymbolPersist> {
  texSymbol: TeX;
  children: Zym<any, any, any>[] = [];
  modifiers: ZymbolModifier[] = [];
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

  toggleModifier = (mod: ZymbolModifier) => {
    const hasMod = this.modifiers.some(
      (m) => m.id.group === mod.id.group && m.id.item === mod.id.item
    );

    if (hasMod) {
      this.removeModifier(mod);
    } else {
      this.addModifier(mod);
    }
  };

  addModifier = (mod: ZymbolModifier) => {
    this.modifiers.push(mod);
  };

  removeModifier = (mod: ZymbolModifier) => {
    this.modifiers = this.modifiers.filter(
      (m) => !(m.id.group === mod.id.group && m.id.item === mod.id.item)
    );
  };

  moveCursorLeft = (_cursor: Cursor) => FAILED_CURSOR_MOVE_RESPONSE;
  takeCursorFromLeft = () => FAILED_CURSOR_MOVE_RESPONSE;
  moveCursorRight = (_cursor: Cursor) => FAILED_CURSOR_MOVE_RESPONSE;
  takeCursorFromRight = () => FAILED_CURSOR_MOVE_RESPONSE;

  addCharacter = (_character: string, _cursor: Cursor) =>
    FAILED_CURSOR_MOVE_RESPONSE;

  renderTex = (_opts: ZymbolRenderArgs) => {
    let finalTex = this.texSymbol;

    /* Now wrap this in all the modifiers */
    for (const mod of this.modifiers) {
      finalTex = `${mod.pre}${finalTex}${mod.post}`;
    }

    return finalTex;
  };

  getDeleteBehavior = () => normalDeleteBehavior(DeleteBehaviorType.ALLOWED);

  delete(_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

  persistData(): SymbolZymbolPersist {
    return {
      [SZP_FIELDS.TEX_SYMBOL]: this.texSymbol,
      [SZP_FIELDS.MODIFIERS]: [...this.modifiers],
    };
  }

  hydrate = async (p: SymbolZymbolPersist): Promise<void> => {
    this.texSymbol = p[SZP_FIELDS.TEX_SYMBOL];
    this.modifiers = p[SZP_FIELDS.MODIFIERS];
  };
}

export function isSymbolZymbol(zym: Zym): zym is SymbolZymbol {
  return zym.getMasterId() === symbolZymbolMaster.zyId;
}
