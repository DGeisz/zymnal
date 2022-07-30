import { hydrateChild } from "../../../../../zym_lib/zym/utils/hydrate";
import { Zym, ZymPersist } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  wrapChildCursorResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { KeyPressModifier } from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../../zym_lib/zy_god/types/context_types";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { getKeyPress, Zymbol, ZymbolRenderArgs } from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { TeX } from "../../zymbol_types";
import { Zocket, ZocketPersist } from "../zocket/zocket";

const MP_FIELDS: {
  MOD_ZOCKET: "z";
  MODIFIERS: "m";
} = {
  MOD_ZOCKET: "z",
  MODIFIERS: "m",
};

export interface ModifierZymbolPersist {
  [MP_FIELDS.MODIFIERS]: ZymbolModifier[];
  [MP_FIELDS.MOD_ZOCKET]: ZymPersist<ZocketPersist>;
}

export const MODIFIER_ZYMBOL_ID = "mod-43de939c";

class ModifierZymbolMaster extends ZyMaster {
  zyId: string = MODIFIER_ZYMBOL_ID;

  newBlankChild(): Zym<any, any, any> {
    return new ModifierZymbol(DUMMY_FRAME, 0, undefined);
  }
}

export const modifierZymbolMaster = new ModifierZymbolMaster();

/* Extensions */
extendZymbol(modifierZymbolMaster);

export interface ZymbolModifier {
  id: {
    group: string;
    item: string | number;
  };
  pre: TeX;
  post: TeX;
}

export class ModifierZymbol extends Zymbol<ModifierZymbolPersist> {
  modZocket: Zocket;
  children: Zymbol[];
  zyMaster: ZyMaster = modifierZymbolMaster;
  modifiers: ZymbolModifier[] = [];

  constructor(
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);
    this.modZocket = new Zocket(true, parentFrame, 0, this);
    this.children = [this.modZocket];
  }

  toggleModifier = (mod: ZymbolModifier) => {
    console.trace("get toggled", this.bid, mod.id.item);
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

  takeCursorAction = (
    action: (cursor: Cursor, ctx: BasicContext) => CursorMoveResponse,
    cursor: Cursor,
    ctx: BasicContext
  ) => {
    const { parentOfCursorElement, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return wrapChildCursorResponse(action(childRelativeCursor, ctx), 0);
    }
  };

  private hasShift = (ctx: BasicContext): boolean => {
    const { modifiers } = getKeyPress(ctx);

    return !!modifiers && modifiers.includes(KeyPressModifier.Shift);
  };

  moveCursorLeft = (cursor: Cursor, ctx: BasicContext) => {
    if (this.hasShift(ctx)) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return this.takeCursorAction(this.modZocket.moveCursorLeft, cursor, ctx);
    }
  };

  moveCursorRight = (cursor: Cursor, ctx: BasicContext) => {
    if (this.hasShift(ctx)) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return this.takeCursorAction(this.modZocket.moveCursorRight, cursor, ctx);
    }
  };

  takeCursorFromLeft = (ctx: BasicContext) => {
    if (this.hasShift(ctx)) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return wrapChildCursorResponse(this.modZocket.takeCursorFromLeft(), 0);
    }
  };
  takeCursorFromRight = (ctx: BasicContext) => {
    if (this.hasShift(ctx)) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return wrapChildCursorResponse(this.modZocket.takeCursorFromRight(), 0);
    }
  };

  addCharacter = (character: string, cursor: Cursor, ctx: BasicContext) => {
    const { parentOfCursorElement, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return wrapChildCursorResponse(
        this.modZocket.addCharacter(character, childRelativeCursor, ctx),
        0
      );
    }
  };

  delete = (cursor: Cursor, ctx: BasicContext) => {
    const { parentOfCursorElement, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return wrapChildCursorResponse(
        this.modZocket.delete(childRelativeCursor, ctx),
        0
      );
    }
  };

  getDeleteBehavior = () => this.modZocket.getDeleteBehavior();

  renderTex = (opts: ZymbolRenderArgs) => {
    const { childRelativeCursor } = extractCursorInfo(opts.cursor);

    if (this.modifiers.length === 2) {
      console.log("get len 2", this.bid);
    }

    let finalTex = this.modZocket.renderTex({ cursor: childRelativeCursor });

    for (const mod of this.modifiers) {
      finalTex = `${mod.pre}${finalTex}${mod.post}`;
    }

    return finalTex;
  };

  persistData(): ModifierZymbolPersist {
    return {
      [MP_FIELDS.MODIFIERS]: [...this.modifiers],
      [MP_FIELDS.MOD_ZOCKET]: this.modZocket.persist(),
    };
  }

  hydrate = async (p: ModifierZymbolPersist): Promise<void> => {
    this.modifiers = p[MP_FIELDS.MODIFIERS];
    this.modZocket = (await hydrateChild(
      this,
      p[MP_FIELDS.MOD_ZOCKET]
    )) as Zocket;
    this.children = [this.modZocket];
  };
}
