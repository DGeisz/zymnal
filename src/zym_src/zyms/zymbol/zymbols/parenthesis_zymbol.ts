import { checkLatex } from "../../../../global_utils/latex_utils";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../zym_lib/zym/utils/hydrate";
import { Zym, ZymPersist } from "../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  implementPartialCmdGroup,
  NONE,
  some,
} from "../../../../zym_lib/zy_trait/zy_command_types";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  wrapChildCursorResponse,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import { ZymbolDirection } from "../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../zym_lib/zy_god/types/context_types";
import { DotModifierCommand } from "../../zymbol_infrastructure/zymbol_frame/transformers/dot_modifiers";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { DeleteBehaviorType, deleteBehaviorNormal } from "../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../zymbol";
import { extendZymbol } from "../zymbol_cmd";
import { Zocket, ZocketPersist } from "./zocket/zocket";
import { deflectMethodToChild } from "./zymbol_utils";

const PZP_FIELDS: {
  BASE_ZOCKET: "b";
  BIG_PARENTHESIS: "p";
  LEFT: "l";
  RIGHT: "r";
} = {
  BASE_ZOCKET: "b",
  BIG_PARENTHESIS: "p",
  LEFT: "l",
  RIGHT: "r",
};

export interface ParenthesisPersist {
  [PZP_FIELDS.BASE_ZOCKET]: ZymPersist<ZocketPersist>;
  [PZP_FIELDS.BIG_PARENTHESIS]: boolean;
  [PZP_FIELDS.LEFT]: string;
  [PZP_FIELDS.RIGHT]: string;
}

export const PARENTHESIS_ZYMBOL_ID = "parenthesis-zymbol";

class ParenthesisZymbolMaster extends ZyMaster {
  zyId: string = PARENTHESIS_ZYMBOL_ID;

  newBlankChild(): Zym<any, any, any> {
    return new ParenthesisZymbol(DUMMY_FRAME, 0, undefined);
  }
}

export const parenthesisZymbolMaster = new ParenthesisZymbolMaster();

extendZymbol(parenthesisZymbolMaster);

function checkParenthesisType(t: string) {
  return checkLatex(`\\l${t} a \\r${t}`);
}

export class ParenthesisZymbol extends Zymbol<ParenthesisPersist> {
  baseZocket: Zocket;
  children: Zymbol<any>[] = [];
  zyMaster: ZyMaster = parenthesisZymbolMaster;
  bigParenthesis = false;

  left = "(";
  right = ")";

  constructor(
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);

    this.baseZocket = new Zocket(parentFrame, 0, this);
    this.children = [this.baseZocket];
  }

  moveCursorLeft = (cursor: Cursor, ctx: BasicContext) =>
    deflectMethodToChild(cursor, ({ childRelativeCursor }) =>
      wrapChildCursorResponse(
        this.baseZocket.moveCursorLeft(childRelativeCursor, ctx),
        0
      )
    );

  takeCursorFromLeft = (ctx: BasicContext) => {
    return wrapChildCursorResponse(this.baseZocket.takeCursorFromLeft(ctx), 0);
  };

  moveCursorRight = (cursor: Cursor, ctx: BasicContext) =>
    deflectMethodToChild(cursor, ({ childRelativeCursor }) =>
      wrapChildCursorResponse(
        this.baseZocket.moveCursorRight(childRelativeCursor, ctx),
        0
      )
    );

  takeCursorFromRight = (ctx: BasicContext) =>
    wrapChildCursorResponse(this.baseZocket.takeCursorFromRight(ctx), 0);

  moveCursorUp = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor }) =>
      wrapChildCursorResponse(
        this.baseZocket.moveCursorUp(childRelativeCursor, ctx),
        0
      )
    );

  captureArrowUp = (
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse => FAILED_CURSOR_MOVE_RESPONSE;

  moveCursorDown = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor }) =>
      wrapChildCursorResponse(
        this.baseZocket.moveCursorDown(childRelativeCursor, ctx),
        0
      )
    );

  captureArrowDown(
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

  addCharacter = (character: string, cursor: Cursor, ctx: BasicContext) =>
    deflectMethodToChild(cursor, ({ childRelativeCursor }) =>
      wrapChildCursorResponse(
        this.baseZocket.addCharacter(character, childRelativeCursor, ctx),
        0
      )
    );

  getDeleteBehavior = () => deleteBehaviorNormal(DeleteBehaviorType.SPLICE);

  delete(cursor: Cursor, ctx: BasicContext): CursorMoveResponse {
    return deflectMethodToChild(cursor, ({ childRelativeCursor }) =>
      wrapChildCursorResponse(
        this.baseZocket.delete(childRelativeCursor, ctx),
        0
      )
    );
  }

  spliceDelete = (_cursor: Cursor, _ctx: BasicContext) => ({
    zymbols: [...this.baseZocket.children],
    putCursorAtEnd: true,
  });

  renderTex = (opts: ZymbolRenderArgs) => {
    const left = this.bigParenthesis ? `\\left${this.left}` : this.left;
    const right = this.bigParenthesis ? `\\right${this.right}` : this.right;

    const { childRelativeCursor } = extractCursorInfo(opts.cursor);

    return `${left}${this.baseZocket.renderTex({
      ...opts,
      cursor: childRelativeCursor,
    })}${right}`;
  };

  persistData(): ParenthesisPersist {
    return {
      [PZP_FIELDS.BASE_ZOCKET]: this.baseZocket.persist(),
      [PZP_FIELDS.BIG_PARENTHESIS]: this.bigParenthesis,
      [PZP_FIELDS.LEFT]: this.left,
      [PZP_FIELDS.RIGHT]: this.right,
    };
  }

  async hydrate(p: Partial<ParenthesisPersist>): Promise<void> {
    await safeHydrate(p, {
      [PZP_FIELDS.BASE_ZOCKET]: async (b) => {
        this.baseZocket = (await hydrateChild(this, b)) as Zocket;
        this.children = [this.baseZocket];
      },
      [PZP_FIELDS.BIG_PARENTHESIS]: (p) => {
        this.bigParenthesis = p;
      },
      [PZP_FIELDS.LEFT]: (l) => {
        this.left = l;
      },
      [PZP_FIELDS.RIGHT]: (r) => {
        this.right = r;
      },
    });
  }
}

const dotModMap: { [key: string]: string } = {
  abs: "vert",
  Abs: "Vert",
  v: "vert",
  V: "Vert",
  c: "ceil",
  f: "floor",
  brc: "brace",
  brk: "brack",
  p: "paren",
  m: "moustache",
  g: "group",
};

const dotModImpl = implementPartialCmdGroup(DotModifierCommand, {
  getNodeTransforms() {
    return {
      id: {
        group: "parenthesis",
        item: "basic",
      },
      cost: 100,
      transform: ({ zymbol, word }) => {
        const parenthesis = zymbol as ParenthesisZymbol;

        if (word in dotModMap) {
          word = dotModMap[word];
        }

        let changed = false;
        if (word === "big") {
          parenthesis.bigParenthesis = true;
          changed = true;
        } else if (word === "sm") {
          parenthesis.bigParenthesis = false;
          changed = true;
        } else if (checkParenthesisType(word)) {
          parenthesis.left = `\\l${word}`;
          parenthesis.right = `\\r${word}`;

          changed = true;
        }

        if (changed) {
          return some(parenthesis);
        } else {
          return NONE;
        }
      },
    };
  },
});

parenthesisZymbolMaster.registerCmds([...dotModImpl]);
