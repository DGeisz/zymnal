import _ from "underscore";
import { last } from "../../../../../global_utils/array_utils";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../../zym_lib/zym/utils/hydrate";
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
import { ZymbolDirection } from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
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
import {
  FunctionBracketIndicator,
  FunctionZymbolMethodSchema,
  FunctionZymbolPersistenceSchema,
  FunctionZymbolSchema,
  FUNCTION_ZYMBOL_ID,
} from "./function_zymbol_schema";
import { ZyPartialPersist } from "../../../../../zym_lib/zy_schema/zy_schema";
import {
  DotModifiersTrait,
  IdentifiedDotModifierZymbolTransformers,
} from "../../../zymbol_infrastructure/zymbol_frame/transformer/std_transformers/equation_transformers/dot_modifiers/dot_modifiers_schema";
import { NONE } from "../../../../../zym_lib/utils/zy_option";

class FunctionZymbolMaster extends ZyMaster<
  FunctionZymbolSchema,
  FunctionZymbolPersistenceSchema,
  FunctionZymbolMethodSchema
> {
  zyId: string = FUNCTION_ZYMBOL_ID;
  dotModifierTransformers: IdentifiedDotModifierZymbolTransformers[] = [];

  constructor() {
    super();
    this.setMethodImplementation({
      addDotModifierTransformer: async (trans) => {
        if (
          !this.dotModifierTransformers.some((s) => _.isEqual(trans.id, s.id))
        ) {
          this.dotModifierTransformers.push(trans);
        }
      },
    });
  }

  newBlankChild(): Zym<any, any, any> {
    return new FunctionZymbol("", 0, {}, DUMMY_FRAME, 0, undefined);
  }
}

export const functionZymbolMaster = new FunctionZymbolMaster();

export class FunctionZymbol extends Zymbol<
  FunctionZymbolSchema,
  FunctionZymbolPersistenceSchema
> {
  children: Zymbol[];
  zyMaster = functionZymbolMaster;
  numZockets: number;
  bracketZockets: FunctionBracketIndicator;

  baseTex: TeX;

  constructor(
    baseTex: TeX,
    numZockets: number,
    bracketZockets: FunctionBracketIndicator,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);

    this.numZockets = numZockets;
    this.bracketZockets = bracketZockets;

    this.children = [];
    for (let i = 0; i < this.numZockets; i++) {
      this.children.push(new Zocket(parentFrame, i, this));
    }

    this.baseTex = baseTex;

    this.setPersistenceSchemaSymbols({
      children: "c",
      numZockets: "z",
      bracketZockets: "bz",
      baseTex: "b",
    });
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
  }

  renderTex = (opts: ZymbolRenderArgs) => {
    const { cursor } = opts;

    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    let baseTex = `\\${this.baseTex}`;

    for (const i of _.range(this.numZockets)) {
      const zocketText = this.children[i].renderTex({
        ...opts,
        cursor: i === nextCursorIndex ? childRelativeCursor : [],
      });

      if (this.bracketZockets[i]) {
        baseTex += `[{${zocketText}}]`;
      } else {
        baseTex += `{${zocketText}}`;
      }
    }

    return baseTex;
  };

  persistData = () => {
    return {
      children: this.children.map((c) => c.persist()),
      baseTex: this.baseTex,
      numZockets: this.numZockets,
      bracketZockets: { ...this.bracketZockets },
    };
  };

  async hydrateFromPartialPersist(
    p: Partial<
      ZyPartialPersist<FunctionZymbolSchema, FunctionZymbolPersistenceSchema>
    >
  ): Promise<void> {
    await safeHydrate(p, {
      baseTex: (tex) => {
        this.baseTex = tex;
      },
      children: async (children) => {
        this.children = (await Promise.all(
          children.map((c) => hydrateChild(this, c))
        )) as Zymbol[];
      },
      numZockets: (z) => {
        this.numZockets = z;
      },
      bracketZockets: (b) => {
        this.bracketZockets = b;
      },
    });

    this.reConnectParentChildren();
  }
}

functionZymbolMaster.implementTrait(DotModifiersTrait, {
  getNodeTransforms: async () => {
    return {
      id: {
        group: "stack",
        item: "toggle",
      },
      transform: ({ zymbol, word }) => {
        for (const transformer of functionZymbolMaster.dotModifierTransformers) {
          const res = transformer.transform({ zymbol, word });

          if (res.some) return res;
        }

        return NONE;
      },
      cost: 100,
    };
  },
});
