import { last } from "../../../../global_utils/array_utils";
import { Zym, ZymPersist } from "../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  wrapChildCursorResponse,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import { BasicContext } from "../../../../zym_lib/zy_god/types/context_types";
import { ZymbolFrame } from "../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { DeleteBehaviorType, normalDeleteBehavior } from "../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../zymbol";
import { extendZymbol } from "../zymbol_cmd";

const SSP_FIELDS: {
  CHILDREN: "c";
  STATUS: "s";
} = {
  CHILDREN: "c",
  STATUS: "s",
};

export interface SuperSubPersist {
  [SSP_FIELDS.CHILDREN]: ZymPersist<any>;
  [SSP_FIELDS.STATUS]: SuperSubStatus;
}

class SuperSubMaster extends ZyMaster {
  zyId: string = "super-sub";

  newBlankChild(): Zym<any, any, any> {
    throw new Error("Method not implemented.");
  }
}

export const superSubMaster = new SuperSubMaster();

extendZymbol(superSubMaster);

enum SuperSubStatus {
  OnlySub,
  OnlySuper,
  Both,
}

export class SuperSubZymbol extends Zymbol<SuperSubPersist> {
  children: Zymbol[] = [];
  zyMaster: ZyMaster = superSubMaster;
  status: SuperSubStatus;

  constructor(
    status: SuperSubStatus,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);

    this.status = status;
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
    /* TODO: FILL THIS IN */
    return "";
  };

  persistData(): SuperSubPersist {
    throw new Error("Method not implemented.");
  }

  hydrate(p: SuperSubPersist): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
