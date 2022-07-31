import _ from "underscore";
import { last } from "../../../../../global_utils/array_utils";
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
import { Zocket } from "../zocket/zocket";

const FZP_FIELDS: {
  CHILDREN: "c";
  ZOCKET_MAPPINGS: "z";
  BASE_TEX: "b";
} = {
  CHILDREN: "c",
  ZOCKET_MAPPINGS: "z",
  BASE_TEX: "b",
};

export interface FunctionZymbolPersist {
  [FZP_FIELDS.CHILDREN]: ZymPersist<any>[];
  [FZP_FIELDS.ZOCKET_MAPPINGS]: number[];
  [FZP_FIELDS.BASE_TEX]: TeX;
}

class FunctionZymbolMaster extends ZyMaster {
  zyId: string = "function-zymbol";

  newBlankChild(): Zym<any, any, any> {
    return new FunctionZymbol("", 0, DUMMY_FRAME, 0, undefined);
  }
}

export const functionZymbolMaster = new FunctionZymbolMaster();

export class FunctionZymbol extends Zymbol<FunctionZymbolPersist> {
  children: Zymbol[];
  zyMaster: ZyMaster<{}> = functionZymbolMaster;
  zocketMapping: number[];

  baseTex: TeX;

  constructor(
    baseTex: TeX,
    zocketMapping: number[] | number,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);

    if (typeof zocketMapping === "number") {
      let z = [];

      for (let i = 0; i < zocketMapping; i++) {
        z.push(i);
      }

      zocketMapping = z;
    }

    this.zocketMapping = zocketMapping;

    this.children = [];
    for (let i = 0; i < zocketMapping.length; i++) {
      this.children.push(new Zocket(parentFrame, i, this));
    }

    this.baseTex = baseTex;
  }

  moveCursorLeft = (cursor: Cursor, ctx: BasicContext) => {
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    if (nextCursorIndex > -1) {
      const child = this.children[nextCursorIndex];

      const res = child.moveCursorLeft(childRelativeCursor, ctx);

      if (res.success) {
        return wrapChildCursorResponse(res, nextCursorIndex);
      } else {
        if (nextCursorIndex > 0) {
          return wrapChildCursorResponse(
            this.children[nextCursorIndex - 1].takeCursorFromRight(ctx),
            nextCursorIndex - 1
          );
        } else {
          return FAILED_CURSOR_MOVE_RESPONSE;
        }
      }
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  takeCursorFromLeft = (ctx: BasicContext) => {
    return wrapChildCursorResponse(this.children[0].takeCursorFromLeft(ctx), 0);
  };

  moveCursorRight = (cursor: Cursor, ctx: BasicContext) => {
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    if (nextCursorIndex > -1) {
      const child = this.children[nextCursorIndex];

      const res = child.moveCursorRight(childRelativeCursor, ctx);

      if (res.success) {
        return wrapChildCursorResponse(res, nextCursorIndex);
      } else {
        if (nextCursorIndex < this.children.length - 1) {
          return wrapChildCursorResponse(
            this.children[nextCursorIndex + 1].takeCursorFromLeft(ctx),
            nextCursorIndex + 1
          );
        } else {
          return FAILED_CURSOR_MOVE_RESPONSE;
        }
      }
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  takeCursorFromRight = (ctx: BasicContext) => {
    return wrapChildCursorResponse(
      last(this.children).takeCursorFromRight(ctx),
      this.children.length - 1
    );
  };

  addCharacter = (character: string, cursor: Cursor, ctx: BasicContext) => {
    const { nextCursorIndex, childRelativeCursor, parentOfCursorElement } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }

    if (nextCursorIndex > -1) {
      const res = wrapChildCursorResponse(
        this.children[nextCursorIndex].addCharacter(
          character,
          childRelativeCursor,
          ctx
        ),
        nextCursorIndex
      );

      return res;
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  getDeleteBehavior = () => normalDeleteBehavior(DeleteBehaviorType.ALLOWED);

  delete(cursor: Cursor, ctx: BasicContext): CursorMoveResponse {
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    if (nextCursorIndex > -1) {
      return wrapChildCursorResponse(
        this.children[nextCursorIndex].delete(childRelativeCursor, ctx),
        nextCursorIndex
      );
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  }

  renderTex = (opts: ZymbolRenderArgs) => {
    const { cursor } = opts;

    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    let baseTex = `\\${this.baseTex}`;

    for (const i of this.zocketMapping) {
      baseTex += `{${this.children[i].renderTex({
        cursor: i === nextCursorIndex ? childRelativeCursor : [],
      })}}`;
    }

    return baseTex;
  };

  persistData = (): FunctionZymbolPersist => {
    return {
      [FZP_FIELDS.CHILDREN]: this.children.map((c) => c.persist()),
      [FZP_FIELDS.BASE_TEX]: this.baseTex,
      [FZP_FIELDS.ZOCKET_MAPPINGS]: [...this.zocketMapping],
    };
  };

  hydrate = async (p: FunctionZymbolPersist): Promise<void> => {
    this.children = (await Promise.all(
      p[FZP_FIELDS.CHILDREN].map((c) => hydrateChild(this, c))
    )) as Zymbol[];
    this.baseTex = p[FZP_FIELDS.BASE_TEX];
    this.zocketMapping = p[FZP_FIELDS.ZOCKET_MAPPINGS];

    this.reConnectParentChildren();
  };
}
