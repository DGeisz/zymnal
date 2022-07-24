import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  wrapChildCursorResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { BasicContext } from "../../../../../zym_lib/zy_god/types/context_types";
import { ZymbolFrame } from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { Zymbol, ZymbolRenderArgs } from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { TeX } from "../../zymbol_types";
import { Zocket } from "../zocket/zocket";

export const MODIFIER_ZYMBOL_ID = "mod-43de939c";

class ModifierZymbolMaster extends ZyMaster {
  zyId: string = MODIFIER_ZYMBOL_ID;
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

export enum BasicModifierId {
  Vec = "v",
  Hat = "h",
  Dot = "d",
  DDot = "dd",
  Underline = "u",
  Bold = "b",
}

function createBasicModifier(
  id: BasicModifierId,
  pre: TeX,
  post: TeX
): ZymbolModifier {
  return {
    id: {
      group: "basic",
      item: id,
    },
    pre,
    post,
  };
}

function createBasicWrapper(id: BasicModifierId, tex: TeX): ZymbolModifier {
  return createBasicModifier(id, `\\${tex}{`, "}");
}

export const BasicZymbolModifiers: { [key: string]: ZymbolModifier } = {
  [BasicModifierId.Vec]: createBasicWrapper(BasicModifierId.Vec, "vec"),
  [BasicModifierId.Hat]: createBasicWrapper(BasicModifierId.Hat, "hat"),
  [BasicModifierId.Dot]: createBasicWrapper(BasicModifierId.Dot, "dot"),
  [BasicModifierId.DDot]: createBasicWrapper(BasicModifierId.DDot, "ddot"),
  [BasicModifierId.Underline]: createBasicWrapper(
    BasicModifierId.Underline,
    "underline"
  ),
  [BasicModifierId.Bold]: createBasicWrapper(BasicModifierId.Bold, "bold"),
};

export class ModifierZymbol extends Zymbol<{}> {
  modZocket: Zocket;
  children: Zymbol[] = [];
  zyMaster: ZyMaster = modifierZymbolMaster;
  modifiers: ZymbolModifier[] = [];

  constructor(
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined,
    persisted?: {}
  ) {
    super(parentFrame, cursorIndex, parent, persisted);
    this.modZocket = new Zocket(false, parentFrame, 0, this);
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

  takeCursorAction = (
    action: (cursor: Cursor, ctx: BasicContext) => CursorMoveResponse,
    cursor: Cursor,
    ctx: BasicContext
  ) => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement || nextCursorIndex === 0) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return wrapChildCursorResponse(action(childRelativeCursor, ctx), 0);
    }
  };

  moveCursorLeft = (cursor: Cursor, ctx: BasicContext) =>
    this.takeCursorAction(this.modZocket.moveCursorLeft, cursor, ctx);

  moveCursorRight = (cursor: Cursor, ctx: BasicContext) =>
    this.takeCursorAction(this.modZocket.moveCursorRight, cursor, ctx);

  takeCursorFromLeft = () =>
    wrapChildCursorResponse(this.modZocket.takeCursorFromLeft(), 0);
  takeCursorFromRight = () =>
    wrapChildCursorResponse(this.modZocket.takeCursorFromRight(), 0);

  addCharacter = (character: string, cursor: Cursor, ctx: BasicContext) => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement || nextCursorIndex === 0) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return wrapChildCursorResponse(
        this.modZocket.addCharacter(character, childRelativeCursor, ctx),
        0
      );
    }
  };

  getDeleteBehavior = () => this.modZocket.getDeleteBehavior();

  renderTex = (opts: ZymbolRenderArgs) => {
    const { childRelativeCursor } = extractCursorInfo(opts.cursor);

    let finalTex = this.modZocket.renderTex({ cursor: childRelativeCursor });

    for (const mod of this.modifiers) {
      finalTex = `${mod.pre}${finalTex}${mod.post}`;
    }

    return finalTex;
  };

  clone(newParent?: Zym<any, any, any> | undefined): Zym<string, {}, any> {
    const newMod = new ModifierZymbol(
      this.parentFrame,
      this.getCursorIndex(),
      newParent ?? this.parent
    );

    newMod.modZocket = this.modZocket.clone(newMod);
    newMod.modifiers = [...this.modifiers];

    return newMod;
  }

  persist(): {} {
    throw new Error("Method not implemented.");
  }
  hydrate(persisted: {}): void {
    throw new Error("Method not implemented.");
  }
}
