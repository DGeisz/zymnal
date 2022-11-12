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
  successfulMoveResponse,
  wrapChildCursorResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { ZymbolDirection } from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  DeleteBehavior,
  DeleteBehaviorType,
  deleteBehaviorNormal,
} from "../../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { Zocket } from "../zocket/zocket";
import { deflectMethodToChild } from "../zymbol_utils";
import {
  SuperSubBothIndex,
  SuperSubPosition,
  SuperSubSchema,
  SuperSubStatus,
  SUPER_SUB_ID,
} from "./super_sub_schema";
import { ZyPartialPersist } from "../../../../../zym_lib/zy_schema/zy_schema";

class SuperSubMaster extends ZyMaster<SuperSubSchema> {
  zyId: string = SUPER_SUB_ID;

  newBlankChild() {
    return new SuperSubZymbol(DUMMY_FRAME, 0, undefined);
  }
}

export const superSubMaster = new SuperSubMaster();

extendZymbol(superSubMaster);

export class SuperSubZymbol extends Zymbol<SuperSubSchema> {
  /* Super goes after sub */
  children: Zymbol[] = [];
  zyMaster = superSubMaster;
  status: SuperSubStatus = SuperSubStatus.Neither;

  standalone = false;

  constructor(
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      children: "c",
      status: "s",
      standalone: "a",
    });
  }

  getChildPosition = (isSuper: boolean) => {
    switch (this.status) {
      case SuperSubStatus.Neither: {
        return -1;
      }
      case SuperSubStatus.OnlySub: {
        return isSuper ? -1 : 0;
      }
      case SuperSubStatus.OnlySuper: {
        return isSuper ? 0 : -1;
      }
      case SuperSubStatus.Both: {
        return isSuper ? 0 : 1;
      }
    }
  };

  getIndexPosition = (index: CursorIndex): SuperSubPosition => {
    switch (this.status) {
      case SuperSubStatus.Neither: {
        return SuperSubPosition.None;
      }
      case SuperSubStatus.OnlySub: {
        return index === 0 ? SuperSubPosition.Sub : SuperSubPosition.None;
      }
      case SuperSubStatus.OnlySuper: {
        return index === 0 ? SuperSubPosition.Super : SuperSubPosition.None;
      }
      case SuperSubStatus.Both: {
        switch (index) {
          case 0: {
            return SuperSubPosition.Super;
          }
          case 1: {
            return SuperSubPosition.Sub;
          }
          default: {
            return SuperSubPosition.None;
          }
        }
      }
    }
  };

  addChild = (isSuper: boolean): Cursor => {
    const newChild = new Zocket(this.parentFrame, 0, this);

    switch (this.status) {
      case SuperSubStatus.Neither: {
        this.children = [newChild];

        this.status = isSuper
          ? SuperSubStatus.OnlySuper
          : SuperSubStatus.OnlySub;

        return [0, 0];
      }
      case SuperSubStatus.OnlySub: {
        if (isSuper) {
          this.children.unshift(newChild);
          this.status = SuperSubStatus.Both;

          this.reIndexChildren();

          return [0, 0];
        } else {
          return [0, 0];
        }
      }
      case SuperSubStatus.OnlySuper: {
        if (isSuper) {
          return [0, 0];
        } else {
          this.children.push(newChild);
          this.status = SuperSubStatus.Both;

          this.reIndexChildren();

          return [1, 0];
        }
      }
      case SuperSubStatus.Both: {
        return [isSuper ? 0 : 1, 0];
      }
    }
  };

  /* ==== Default Methods ==== */

  moveCursorLeft = (cursor: Cursor, ctx: BasicContext) =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) =>
      wrapChildCursorResponse(
        this.children[nextCursorIndex].moveCursorLeft(childRelativeCursor, ctx),
        nextCursorIndex
      )
    );

  takeCursorFromLeft = (ctx: BasicContext) => {
    return wrapChildCursorResponse(this.children[0].takeCursorFromLeft(ctx), 0);
  };

  moveCursorRight = (cursor: Cursor, ctx: BasicContext) =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) =>
      wrapChildCursorResponse(
        this.children[nextCursorIndex].moveCursorRight(
          childRelativeCursor,
          ctx
        ),
        nextCursorIndex
      )
    );

  takeCursorFromRight = (ctx: BasicContext) => {
    return wrapChildCursorResponse(
      this.children[0].takeCursorFromRight(ctx),
      0
    );
  };

  moveCursorUp = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse =>
    deflectMethodToChild(cursor, ({ childRelativeCursor, nextCursorIndex }) => {
      const res = wrapChildCursorResponse(
        this.children[nextCursorIndex].moveCursorUp(childRelativeCursor, ctx),
        nextCursorIndex
      );

      if (res.success) return res;

      if (
        this.status === SuperSubStatus.Both &&
        this.getIndexPosition(nextCursorIndex) === SuperSubPosition.Sub
      ) {
        const { nextCursorIndex: nextChild } =
          extractCursorInfo(childRelativeCursor);

        return successfulMoveResponse([
          SuperSubBothIndex.Super,
          Math.min(
            nextChild,
            this.children[SuperSubBothIndex.Super].children.length
          ),
        ]);
      }

      return FAILED_CURSOR_MOVE_RESPONSE;
    });

  captureArrowUp = (
    fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse => {
    switch (fromSide) {
      case ZymbolDirection.LEFT: {
        switch (this.status) {
          case SuperSubStatus.Both: {
            return successfulMoveResponse([SuperSubBothIndex.Super, 0]);
          }
          case SuperSubStatus.OnlySuper: {
            return successfulMoveResponse([0, 0]);
          }
        }
        break;
      }
      case ZymbolDirection.RIGHT: {
        switch (this.status) {
          case SuperSubStatus.Both: {
            return successfulMoveResponse([
              SuperSubBothIndex.Super,
              this.children[SuperSubBothIndex.Super].children.length,
            ]);
          }
          case SuperSubStatus.OnlySuper: {
            return successfulMoveResponse([
              0,
              this.children[0].children.length,
            ]);
          }
        }
        break;
      }
    }

    return FAILED_CURSOR_MOVE_RESPONSE;
  };

  moveCursorDown = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    return deflectMethodToChild(
      cursor,
      ({ childRelativeCursor, nextCursorIndex }) => {
        const res = wrapChildCursorResponse(
          this.children[nextCursorIndex].moveCursorUp(childRelativeCursor, ctx),
          nextCursorIndex
        );

        if (res.success) return res;

        if (
          this.status === SuperSubStatus.Both &&
          this.getIndexPosition(nextCursorIndex) === SuperSubPosition.Super
        ) {
          const { nextCursorIndex: nextChild } =
            extractCursorInfo(childRelativeCursor);

          return successfulMoveResponse([
            SuperSubBothIndex.Sub,
            Math.min(
              nextChild,
              this.children[SuperSubBothIndex.Sub].children.length
            ),
          ]);
        }

        return FAILED_CURSOR_MOVE_RESPONSE;
      }
    );
  };

  captureArrowDown = (
    fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse => {
    switch (fromSide) {
      case ZymbolDirection.LEFT: {
        switch (this.status) {
          case SuperSubStatus.Both: {
            return successfulMoveResponse([SuperSubBothIndex.Sub, 0]);
          }
          case SuperSubStatus.OnlySub: {
            return successfulMoveResponse([0, 0]);
          }
        }
        break;
      }
      case ZymbolDirection.RIGHT: {
        switch (this.status) {
          case SuperSubStatus.Both: {
            return successfulMoveResponse([
              SuperSubBothIndex.Sub,
              this.children[SuperSubBothIndex.Sub].children.length,
            ]);
          }
          case SuperSubStatus.OnlySub: {
            return successfulMoveResponse([
              0,
              this.children[0].children.length,
            ]);
          }
        }
        break;
      }
    }

    return FAILED_CURSOR_MOVE_RESPONSE;
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

  getDeleteBehavior = () => {
    if (this.children.every((c) => c.children.length === 0)) {
      return deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);
    }

    return deleteBehaviorNormal(DeleteBehaviorType.ABSORB);
  };

  absorbCursor = (ctx: BasicContext) => {
    if (this.children.length === 1) {
      return this.takeCursorFromRight(ctx);
    } else {
      return wrapChildCursorResponse(
        this.children[SuperSubBothIndex.Sub].takeCursorFromRight(ctx),
        SuperSubBothIndex.Sub
      );
    }
  };

  letParentDeleteWithDeleteBehavior = (
    cursor: Cursor,
    _ctx: BasicContext
  ): DeleteBehavior | undefined => {
    if (this.status === SuperSubStatus.Neither) {
      return deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);
    }

    const { parentOfCursorElement, childRelativeCursor, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) return undefined;

    const child = this.children[nextCursorIndex];

    if (child) {
      if (child.children.length > 0 && childRelativeCursor[0] === 0) {
        if (this.status === SuperSubStatus.Both) {
          return deleteBehaviorNormal(DeleteBehaviorType.MOVE_LEFT);
        } else {
          return deleteBehaviorNormal(DeleteBehaviorType.SPLICE);
        }
      } else if (child.children.length === 0) {
        if (this.status === SuperSubStatus.Both) {
          switch (this.getIndexPosition(nextCursorIndex)) {
            case SuperSubPosition.Super: {
              this.status = SuperSubStatus.OnlySub;
              this.children = [this.children[SuperSubBothIndex.Sub]];

              return deleteBehaviorNormal(DeleteBehaviorType.ABSORB);
            }
            case SuperSubPosition.Sub: {
              this.status = SuperSubStatus.OnlySuper;
              this.children = [this.children[SuperSubBothIndex.Super]];

              return deleteBehaviorNormal(DeleteBehaviorType.ABSORB);
            }
          }

          if (this.getIndexPosition(nextCursorIndex)) {
            return deleteBehaviorNormal(DeleteBehaviorType.MOVE_LEFT);
          }
        } else {
          return deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);
        }
      }
    }

    return undefined;
  };

  spliceDelete = (
    _cursor: Cursor,
    _ctx: BasicContext
  ): { zymbols: Zymbol[]; putCursorAtEnd: boolean } => {
    if (this.status === SuperSubStatus.Both) {
      let usingSuperZymbols = true;
      let zymbols;

      if (this.children[SuperSubBothIndex.Super].children.length === 0) {
        usingSuperZymbols = false;
        zymbols = [...this.children[SuperSubBothIndex.Sub].children];
      } else {
        zymbols = [...this.children[SuperSubBothIndex.Super].children];
      }

      return {
        zymbols,
        putCursorAtEnd: usingSuperZymbols,
      };
    }

    return {
      zymbols: [...this.children[0].children],
      putCursorAtEnd: false,
    };
  };

  delete(cursor: Cursor, ctx: BasicContext): CursorMoveResponse {
    return deflectMethodToChild(
      cursor,
      ({ childRelativeCursor, nextCursorIndex }) => {
        return wrapChildCursorResponse(
          this.children[nextCursorIndex].delete(childRelativeCursor, ctx),
          nextCursorIndex
        );
      }
    );
  }

  renderTex = (opts: ZymbolRenderArgs) => {
    const { cursor } = opts;
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    const newOpts = { ...opts, cursor: childRelativeCursor };

    let tex;
    switch (this.status) {
      case SuperSubStatus.Neither: {
        tex = "";
        break;
      }
      case SuperSubStatus.Both: {
        tex = `_{${this.children[1].renderTex({
          ...opts,
          cursor: nextCursorIndex === 1 ? childRelativeCursor : [],
        })}}^{${this.children[0].renderTex({
          ...opts,
          cursor: nextCursorIndex === 0 ? childRelativeCursor : [],
        })}}`;
        break;
      }
      case SuperSubStatus.OnlySub: {
        tex = `_{${this.children[0].renderTex(newOpts)}}`;
        break;
      }
      case SuperSubStatus.OnlySuper: {
        tex = `^{${this.children[0].renderTex(newOpts)}}`;
        break;
      }
    }

    if (this.prevZymbolIsSuperSub() || this.standalone) {
      tex = `{${tex}}`;
    }

    return tex;
  };

  prevZymbolIsSuperSub = () => {
    const i = this.getCursorIndex();

    if (i > 0) {
      return this.parent?.children[i - 1]?.getMasterId() === SUPER_SUB_ID;
    }

    return false;
  };

  persistData() {
    return {
      children: this.children.map((c) => c.persist()),
      status: this.status,
      standalone: this.standalone,
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<SuperSubSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      children: async (children) => {
        this.children = (await Promise.all(
          children.map((c) => hydrateChild(this, c))
        )) as Zymbol[];
      },
      status: (s) => {
        this.status = s;
      },
      standalone: (s) => {
        this.standalone = s;
      },
    });
  }

  getRefreshedChildrenPointer(): Zym[] {
    return this.children;
  }
}
