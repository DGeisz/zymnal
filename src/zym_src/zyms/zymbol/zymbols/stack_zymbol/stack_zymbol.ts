import _ from "underscore";
import { checkLatex } from "../../../../../global_utils/latex_utils";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../../zym_lib/zym/utils/hydrate";
import type { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import { NONE, zySome } from "../../../../../zym_lib/utils/zy_option";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
  wrapChildCursorResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  ZymbolDirection,
  ZymKeyPress,
} from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  DeleteBehavior,
  deleteBehaviorNormal,
  DeleteBehaviorType,
} from "../../delete_behavior";
import {
  enterUsedToConfirmTransform,
  SpliceDeleteResponse,
  Zymbol,
  ZymbolRenderArgs,
} from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { TeX } from "../../zymbol_types";
import { Zocket } from "../zocket/zocket";
import { deflectMethodToChild } from "../zymbol_utils";
import { ZyGodMethod } from "../../../../../zym_lib/zy_god/zy_god_schema";
import { StackZymbolSchema, STACK_ZYMBOL_ID } from "./stack_zymbol_schema";
import { ZyPartialPersist } from "../../../../../zym_lib/zy_schema/zy_schema";
import { DotModifiersTrait } from "../../../zymbol_infrastructure/zymbol_frame/transformer/std_transformers/equation_transformers/dot_modifiers/dot_modifiers_schema";

export function checkStackOperator(op: TeX): boolean {
  return (
    checkLatex(`\\${op}{a}{a}`) &&
    !checkLatex(`\\${op}{a}`) &&
    !checkLatex(`\\${op}`)
  );
}

class StackZymbolMaster extends ZyMaster<StackZymbolSchema> {
  zyId: string = STACK_ZYMBOL_ID;

  newBlankChild() {
    return new StackZymbol("", DUMMY_FRAME, 0, undefined);
  }
}

export const stackZymbolMaster = new StackZymbolMaster();

extendZymbol(stackZymbolMaster);

export enum StackPosition {
  TOP = 0,
  BOTTOM = 1,
}

export class StackZymbol extends Zymbol<StackZymbolSchema> {
  zyMaster = stackZymbolMaster;
  /* 0 is at the top, 1 is at the bottom */
  children: [Zocket, Zocket];
  private operator: TeX;

  constructor(
    operator: TeX,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);

    this.operator = operator;

    this.children = [
      new Zocket(parentFrame, 0, this),
      new Zocket(parentFrame, 1, this),
    ];

    this.setPersistenceSchemaSymbols({
      children: "c",
      operator: "o",
    });
  }

  setOperator(operator: TeX) {
    this.operator = operator;
  }

  moveCursorLeft = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) =>
      wrapChildCursorResponse(
        this.children[nextCursorIndex].moveCursorLeft(childRelativeCursor, ctx),
        nextCursorIndex
      )
    );

  takeCursorFromLeft = (ctx: BasicContext): CursorMoveResponse =>
    wrapChildCursorResponse(
      this.children[StackPosition.TOP].takeCursorFromLeft(ctx),
      StackPosition.TOP
    );

  moveCursorRight = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) =>
      wrapChildCursorResponse(
        this.children[nextCursorIndex].moveCursorRight(
          childRelativeCursor,
          ctx
        ),
        nextCursorIndex
      )
    );

  takeCursorFromRight = (ctx: BasicContext): CursorMoveResponse =>
    wrapChildCursorResponse(
      this.children[StackPosition.TOP].takeCursorFromRight(ctx),
      StackPosition.TOP
    );

  moveCursorUp = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) => {
      const res = wrapChildCursorResponse(
        this.children[nextCursorIndex].moveCursorUp(childRelativeCursor, ctx),
        nextCursorIndex
      );

      if (res.success) return res;

      if (nextCursorIndex === StackPosition.BOTTOM) {
        const { nextCursorIndex: nextChildIndex } =
          extractCursorInfo(childRelativeCursor);

        return successfulMoveResponse([
          StackPosition.TOP,
          Math.min(
            nextChildIndex,
            this.children[StackPosition.TOP].children.length
          ),
        ]);
      }

      return FAILED_CURSOR_MOVE_RESPONSE;
    });

  captureArrowUp = (
    fromSide: ZymbolDirection,
    ctx: BasicContext
  ): CursorMoveResponse => {
    if (fromSide === ZymbolDirection.LEFT) {
      return wrapChildCursorResponse(
        this.children[StackPosition.TOP].takeCursorFromLeft(ctx),
        StackPosition.TOP
      );
    } else {
      return wrapChildCursorResponse(
        this.children[StackPosition.TOP].takeCursorFromRight(ctx),
        StackPosition.TOP
      );
    }
  };

  moveCursorDown = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) => {
      const res = wrapChildCursorResponse(
        this.children[nextCursorIndex].moveCursorDown(childRelativeCursor, ctx),
        nextCursorIndex
      );

      if (res.success) return res;

      if (nextCursorIndex === StackPosition.TOP) {
        const { nextCursorIndex: nextChildIndex } =
          extractCursorInfo(childRelativeCursor);

        return successfulMoveResponse([
          StackPosition.BOTTOM,
          Math.min(
            nextChildIndex,
            this.children[StackPosition.BOTTOM].children.length
          ),
        ]);
      }

      return FAILED_CURSOR_MOVE_RESPONSE;
    });

  captureArrowDown = (
    fromSide: ZymbolDirection,
    ctx: BasicContext
  ): CursorMoveResponse => {
    if (fromSide === ZymbolDirection.LEFT) {
      return wrapChildCursorResponse(
        this.children[StackPosition.BOTTOM].takeCursorFromLeft(ctx),
        StackPosition.BOTTOM
      );
    } else {
      return wrapChildCursorResponse(
        this.children[StackPosition.BOTTOM].takeCursorFromRight(ctx),
        StackPosition.BOTTOM
      );
    }
  };

  addCharacter = (
    character: string,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) =>
      wrapChildCursorResponse(
        this.children[nextCursorIndex].addCharacter(
          character,
          childRelativeCursor,
          ctx
        ),
        nextCursorIndex
      )
    );

  defaultKeyPressHandler = (
    keyPress: ZymKeyPress,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse => {
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    if (keyPress.type === KeyPressBasicType.Enter) {
      if (
        nextCursorIndex === StackPosition.TOP &&
        _.isEqual(childRelativeCursor, [
          this.children[StackPosition.TOP].children.length,
        ])
      ) {
        if (enterUsedToConfirmTransform(ctx)) {
          this.callZentinelMethod(ZyGodMethod.queueSimulatedKeyPress, {
            type: KeyPressBasicType.Enter,
          });
        }

        return wrapChildCursorResponse(
          this.children[StackPosition.BOTTOM].takeCursorFromLeft(ctx),
          StackPosition.BOTTOM
        );
      } else if (
        cursor.length === 0 ||
        nextCursorIndex <= -1 ||
        nextCursorIndex >= this.children.length
      ) {
        this.callZentinelMethod(ZyGodMethod.queueSimulatedKeyPress, {
          type: KeyPressBasicType.ArrowRight,
        });

        return FAILED_CURSOR_MOVE_RESPONSE;
      }
    }
    return wrapChildCursorResponse(
      this.children[nextCursorIndex].defaultKeyPressHandler(
        keyPress,
        childRelativeCursor,
        ctx
      ),
      nextCursorIndex
    );
  };

  bothChildrenEmpty = () => this.children.every((c) => c.children.length === 0);

  spliceDelete = (
    cursor: Cursor,
    _ctx: BasicContext
  ): SpliceDeleteResponse | undefined => {
    const { nextCursorIndex } = extractCursorInfo(cursor);

    const child = this.children[nextCursorIndex];

    if (child) {
      if (nextCursorIndex === StackPosition.TOP) {
        if (child.children.length === 0) {
          return {
            zymbols: [...this.children[StackPosition.BOTTOM].children],
            putCursorAtEnd: false,
          };
        }
      } else if (nextCursorIndex === StackPosition.BOTTOM) {
        if (child.children.length === 0) {
          return {
            zymbols: [...this.children[StackPosition.TOP].children],
            putCursorAtEnd: true,
          };
        }
      }
    }
  };

  absorbCursor = (ctx: BasicContext) =>
    wrapChildCursorResponse(
      this.children[StackPosition.BOTTOM].takeCursorFromRight(ctx),
      StackPosition.BOTTOM
    );

  letParentDeleteWithDeleteBehavior = (
    cursor: Cursor,
    _ctx: BasicContext
  ): DeleteBehavior | undefined => {
    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(cursor);

    const child = this.children[nextCursorIndex];

    if (child) {
      if (child.children.length === 0) {
        /* Make sure this condition is covered for splice */
        return deleteBehaviorNormal(DeleteBehaviorType.SPLICE);
      } else if (_.isEqual(childRelativeCursor, [0])) {
        return deleteBehaviorNormal(DeleteBehaviorType.MOVE_LEFT);
      }
    }
  };

  getDeleteBehavior = (): DeleteBehavior => {
    if (this.bothChildrenEmpty()) {
      return deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);
    } else {
      return deleteBehaviorNormal(DeleteBehaviorType.ABSORB);
    }
  };

  delete = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) => {
      return wrapChildCursorResponse(
        this.children[nextCursorIndex].delete(childRelativeCursor, ctx),
        nextCursorIndex
      );
    });

  renderTex = (opts: ZymbolRenderArgs): string => {
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(
      opts.cursor
    );

    return `\\${this.operator}{${this.children[StackPosition.TOP].renderTex({
      ...opts,
      cursor: nextCursorIndex === StackPosition.TOP ? childRelativeCursor : [],
    })}}{${this.children[StackPosition.BOTTOM].renderTex({
      ...opts,
      cursor:
        nextCursorIndex === StackPosition.BOTTOM ? childRelativeCursor : [],
    })}}`;
  };

  persistData = () => {
    return {
      children: this.children.map((c) => c.persist()),
      operator: this.operator,
    };
  };

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<StackZymbolSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      children: async (children) => {
        this.children = (await Promise.all(
          children.map((c) => hydrateChild(this, c))
        )) as [Zocket, Zocket];
      },
      operator: async (operator) => {
        this.operator = operator;
      },
    });
  }
}

const dotModMap: { [key: string]: string } = {
  cf: "cfrac",
  fr: "frac",
  tf: "tfrac",
  df: "dfrac",
  bn: "binom",
  ch: "binom",
  tb: "tbinom",
  db: "dbinom",
};

stackZymbolMaster.implementTrait(DotModifiersTrait, {
  async getNodeTransforms() {
    return {
      id: {
        group: "stack",
        item: "toggle",
      },
      transform: ({ zymbol, word }) => {
        const stack = zymbol as StackZymbol;

        if (word in dotModMap) {
          word = dotModMap[word];
        }

        if (checkStackOperator(word)) {
          stack.setOperator(word);

          return zySome(stack);
        }

        return NONE;
      },
      cost: 100,
    };
  },
});
