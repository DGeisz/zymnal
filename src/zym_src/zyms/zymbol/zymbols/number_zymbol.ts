import { forEachTrailingCommentRange } from "typescript";
import { number } from "zod";
import {
  cursorToString,
  wrapHtmlId,
} from "../../../../global_utils/latex_utils";
import { floatToReadableString } from "../../../../global_utils/text_utils";
import { safeHydrate } from "../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  FAILED_CURSOR_MOVE_RESPONSE,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import { BasicContext } from "../../../../zym_lib/zy_god/types/context_types";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { DeleteBehaviorType, normalDeleteBehavior } from "../delete_behavior";
import { basicZymbolHtmlIdImpl, Zymbol, ZymbolRenderArgs } from "../zymbol";
import { extendZymbol } from "../zymbol_cmd";

const NZ_FIELDS: {
  NUMBER: "n";
} = {
  NUMBER: "n",
};

export interface NumberZymbolPersist {
  [NZ_FIELDS.NUMBER]: number;
}

export const NUMBER_ZYMBOL_NAME = "number-zymbol";

class NumberZymbolMaster extends ZyMaster {
  zyId: string = NUMBER_ZYMBOL_NAME;

  newBlankChild(): Zym<any, any, any> {
    return new NumberZymbol(0, DUMMY_FRAME, 0, undefined);
  }
}

export const numberZymbolMaster = new NumberZymbolMaster();

extendZymbol(numberZymbolMaster);

export class NumberZymbol extends Zymbol<NumberZymbolPersist> {
  children: Zymbol[] = [];
  zyMaster: ZyMaster = numberZymbolMaster;
  number: number;

  constructor(
    number: number,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);
    this.number = number;
  }

  moveCursorLeft = (_cursor: Cursor, _ctx: BasicContext) =>
    FAILED_CURSOR_MOVE_RESPONSE;
  takeCursorFromLeft = (_ctx: BasicContext) => FAILED_CURSOR_MOVE_RESPONSE;
  moveCursorRight = (_cursor: Cursor, _ctx: BasicContext) =>
    FAILED_CURSOR_MOVE_RESPONSE;
  takeCursorFromRight = (_ctx: BasicContext) => FAILED_CURSOR_MOVE_RESPONSE;
  addCharacter = (_character: string, _cursor: Cursor, _ctx: BasicContext) =>
    FAILED_CURSOR_MOVE_RESPONSE;

  getDeleteBehavior = () => normalDeleteBehavior(DeleteBehaviorType.ALLOWED);
  delete(_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

  renderTex = (opts: ZymbolRenderArgs) => {
    const { excludeHtmlIds } = opts;
    const finalTex = floatToReadableString(this.number);

    if (excludeHtmlIds) {
      return finalTex;
    } else {
      return wrapHtmlId(finalTex, cursorToString(this.getFullCursorPointer()));
    }
  };

  persistData(): NumberZymbolPersist {
    return {
      [NZ_FIELDS.NUMBER]: this.number,
    };
  }

  async hydrate(p: Partial<NumberZymbolPersist>): Promise<void> {
    await safeHydrate(p, {
      [NZ_FIELDS.NUMBER]: (n) => {
        this.number = n;
      },
    });
  }
}

numberZymbolMaster.registerCmds([...basicZymbolHtmlIdImpl]);
