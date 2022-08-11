import _ from "underscore";
import { last } from "../../../../../global_utils/array_utils";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../../zym_lib/zym/utils/hydrate";
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
import { ZymbolDirection } from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../../zym_lib/zy_god/types/context_types";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  DeleteBehaviorType,
  deleteBehaviorNormal,
  DeleteBehavior,
} from "../../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../../zymbol";
import { TeX } from "../../zymbol_types";
import { Zocket } from "../zocket/zocket";
import { deflectMethodToChild } from "../zymbol_utils";

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
  zyMaster: ZyMaster = functionZymbolMaster;
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

  takeCursorFromRight = (ctx: BasicContext) =>
    wrapChildCursorResponse(
      last(this.children).takeCursorFromRight(ctx),
      this.children.length - 1
    );

  moveCursorUp = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) =>
      wrapChildCursorResponse(
        this.children[nextCursorIndex]?.moveCursorUp(childRelativeCursor, ctx),
        nextCursorIndex
      )
    );

  captureArrowUp(
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

  moveCursorDown = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) =>
      wrapChildCursorResponse(
        this.children[nextCursorIndex]?.moveCursorDown(
          childRelativeCursor,
          ctx
        ),
        nextCursorIndex
      )
    );

  captureArrowDown(
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

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

  checkAllChildrenEmpty = () =>
    this.children.every((c) => c.children.length === 0);

  letParentDeleteWithDeleteBehavior = (
    cursor: Cursor,
    _ctx: BasicContext
  ): DeleteBehavior | undefined => {
    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    if (nextCursorIndex > -1) {
      if (nextCursorIndex === 0) {
        if (this.checkAllChildrenEmpty()) {
          return deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);
        } else if (_.isEqual(childRelativeCursor, [0])) {
          return deleteBehaviorNormal(DeleteBehaviorType.MOVE_LEFT);
        }
      }
    }
  };

  getDeleteBehavior = () => {
    if (this.checkAllChildrenEmpty()) {
      return deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);
    } else {
      return deleteBehaviorNormal(DeleteBehaviorType.ABSORB);
    }
  };

  delete(cursor: Cursor, ctx: BasicContext): CursorMoveResponse {
    return deflectMethodToChild(
      cursor,
      ({ childRelativeCursor, nextCursorIndex }) => {
        const child = this.children[nextCursorIndex];

        if (
          child.children.length === 0 ||
          _.isEqual([0], childRelativeCursor)
        ) {
          return wrapChildCursorResponse(
            this.children[nextCursorIndex - 1]?.takeCursorFromRight(ctx),
            nextCursorIndex - 1
          );
        }

        return wrapChildCursorResponse(
          child.delete(childRelativeCursor, ctx),
          nextCursorIndex
        );
      }
    );

    // if (nextCursorIndex > -1) {
    //   return wrapChildCursorResponse(
    //     this.children[nextCursorIndex].delete(childRelativeCursor, ctx),
    //     nextCursorIndex
    //   );
    // } else {
    //   return FAILED_CURSOR_MOVE_RESPONSE;
    // }
  }

  renderTex = (opts: ZymbolRenderArgs) => {
    const { cursor } = opts;

    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    let baseTex = `\\${this.baseTex}`;

    for (const i of this.zocketMapping) {
      baseTex += `{${this.children[i].renderTex({
        ...opts,
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

  hydrate = async (p: Partial<FunctionZymbolPersist>): Promise<void> => {
    await safeHydrate(p, {
      [FZP_FIELDS.BASE_TEX]: (tex) => {
        this.baseTex = tex;
      },
      [FZP_FIELDS.CHILDREN]: async (children) => {
        this.children = (await Promise.all(
          children.map((c) => hydrateChild(this, c))
        )) as Zymbol[];
      },
      [FZP_FIELDS.ZOCKET_MAPPINGS]: async (zm) => {
        this.zocketMapping = zm;
      },
    });

    this.reConnectParentChildren();
  };
}
