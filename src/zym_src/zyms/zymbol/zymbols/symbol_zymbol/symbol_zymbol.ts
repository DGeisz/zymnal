import { last } from "../../../../../global_utils/array_utils";
import {
  cursorToString,
  wrapHtmlId,
} from "../../../../../global_utils/latex_utils";
import { safeHydrate } from "../../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  FAILED_CURSOR_MOVE_RESPONSE,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { ZymbolDirection } from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import { operatorList } from "../../../zymbol_infrastructure/zymbol_frame/transformer/std_transformers/transform_utils";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  DeleteBehaviorType,
  deleteBehaviorNormal,
} from "../../delete_behavior";
import { Zymbol, ZymbolHtmlIdTrait, ZymbolRenderArgs } from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { TeX } from "../../zymbol_types";
import { ZymbolModifier } from "../zocket/zocket_schema";
import {
  SymbolZymbolPersistenceSchema,
  SymbolZymbolSchema,
  SYMBOL_ZYMBOL_ID,
} from "./symbol_zymbol_schema";
import { ZyPartialPersist } from "../../../../../zym_lib/zy_schema/zy_schema";

const htmlIdBlacklist = operatorList;

class SymbolZymbolMaster extends ZyMaster<
  SymbolZymbolSchema,
  SymbolZymbolPersistenceSchema
> {
  zyId: string = SYMBOL_ZYMBOL_ID;

  newBlankChild(): Zym<any, any, any> {
    return new SymbolZymbol("", DUMMY_FRAME, 0, undefined);
  }
}

export const symbolZymbolMaster = new SymbolZymbolMaster();

extendZymbol(symbolZymbolMaster);

export class SymbolZymbol extends Zymbol<
  SymbolZymbolSchema,
  SymbolZymbolPersistenceSchema
> {
  texSymbol: TeX;
  children: Zymbol[] = [];
  modifiers: ZymbolModifier[] = [];
  zyMaster = symbolZymbolMaster;

  constructor(
    texSymbol: string,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);
    this.texSymbol = texSymbol;

    this.setPersistenceSchemaSymbols({
      texSymbol: "t",
      modifiers: "m",
    });
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

  getModsByGroup = (group: string) =>
    this.modifiers.filter((m) => m.id.group === group);

  removeGroupMods = (group: string) => {
    this.modifiers = this.modifiers.filter((m) => !(m.id.group === group));
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

  moveCursorUp = (_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse =>
    FAILED_CURSOR_MOVE_RESPONSE;
  captureArrowUp = (
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse => FAILED_CURSOR_MOVE_RESPONSE;
  moveCursorDown = (_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse =>
    FAILED_CURSOR_MOVE_RESPONSE;
  captureArrowDown = (
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse => FAILED_CURSOR_MOVE_RESPONSE;

  addCharacter = (_character: string, _cursor: Cursor) =>
    FAILED_CURSOR_MOVE_RESPONSE;

  renderTex = (opts: ZymbolRenderArgs) => {
    const { excludeHtmlIds } = opts;

    let finalTex = this.texSymbol;

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

  getDeleteBehavior = () => deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);

  delete(_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

  persistData() {
    return {
      texSymbol: this.texSymbol,
      modifiers: [...this.modifiers],
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<
      ZyPartialPersist<SymbolZymbolSchema, SymbolZymbolPersistenceSchema>
    >
  ): Promise<void> {
    await safeHydrate(p, {
      modifiers: (mod) => {
        this.modifiers = mod;
      },
      texSymbol: (tex) => {
        this.texSymbol = tex;
      },
    });
  }
}

symbolZymbolMaster.implementTrait(ZymbolHtmlIdTrait, {
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
});
