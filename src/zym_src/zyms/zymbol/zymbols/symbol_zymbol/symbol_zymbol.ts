import { last } from "../../../../../global_utils/array_utils";
import {
  backslash,
  cursorToString,
  wrapHtmlId,
} from "../../../../../global_utils/latex_utils";
import { safeHydrate } from "../../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import { implementPartialCmdGroup } from "../../../../../zym_lib/zy_commands/zy_command_types";
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
import {
  basicZymbolHtmlIdImpl,
  Zymbol,
  ZymbolHtmlIdCommandGroup,
  ZymbolRenderArgs,
} from "../../zymbol";
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

let integralList = [];

for (let i = 0; i < 3; i++) {
  let prefix = "";
  for (let j = 1; j < i + 1; j++) {
    prefix += "i";
  }

  integralList.push(`${prefix}nt`);
  integralList.push(`o${prefix}nt`);
}

integralList = integralList.map(backslash);

const htmlIdBlacklist = [...integralList];

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
  children: Zymbol[] = [];
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

  renderTex = (opts: ZymbolRenderArgs) => {
    const { excludeHtmlIds } = opts;

    let finalTex = this.texSymbol;

    console.log("ft", finalTex, this.texSymbol);

    /* Now wrap this in all the modifiers */
    for (const mod of this.modifiers) {
      finalTex = `${mod.pre}${finalTex}${mod.post}`;
    }

    if (excludeHtmlIds || htmlIdBlacklist.includes(finalTex)) {
      return finalTex;
    } else {
      return wrapHtmlId(finalTex, cursorToString(this.getFullCursorPointer()));
    }
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

  hydrate = async (p: Partial<SymbolZymbolPersist>): Promise<void> => {
    await safeHydrate(p, {
      [SZP_FIELDS.MODIFIERS]: (mod) => {
        this.modifiers = mod;
      },
      [SZP_FIELDS.TEX_SYMBOL]: (tex) => {
        this.texSymbol = tex;
      },
    });
  };
}

export function isSymbolZymbol(zym: Zym): zym is SymbolZymbol {
  return zym.getMasterId() === symbolZymbolMaster.zyId;
}

const symbolZymbolHtmlIdImpl = implementPartialCmdGroup(
  ZymbolHtmlIdCommandGroup,
  {
    async getAllDescendentHTMLIds(zym) {
      if (htmlIdBlacklist.includes((zym as SymbolZymbol).texSymbol)) {
        return [];
      }

      const pointer = zym.getFullCursorPointer();

      const nextPointer = [...pointer];
      nextPointer.splice(nextPointer.length - 1, 1, last(nextPointer) + 1);

      return [
        {
          loc: pointer,
          clickCursor: nextPointer,
        },
      ];
    },
  }
);

symbolZymbolMaster.registerCmds([...symbolZymbolHtmlIdImpl]);
