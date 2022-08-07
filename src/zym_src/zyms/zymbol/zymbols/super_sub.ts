import _ from "underscore";
import { last } from "../../../../global_utils/array_utils";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../zym_lib/zym/utils/hydrate";
import { Zym, ZymPersist } from "../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  wrapChildCursorResponse,
} from "../../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  ZymKeyPress,
} from "../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../zym_lib/zy_god/types/context_types";
import { CreateZyGodMessage } from "../../../../zym_lib/zy_god/zy_god";
import { DUMMY_FRAME } from "../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { DeleteBehaviorType, normalDeleteBehavior } from "../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../zymbol";
import { extendZymbol } from "../zymbol_cmd";
import { Zocket } from "./zocket/zocket";

const SSP_FIELDS: {
  CHILDREN: "c";
  STATUS: "s";
} = {
  CHILDREN: "c",
  STATUS: "s",
};

export interface SuperSubPersist {
  [SSP_FIELDS.CHILDREN]: ZymPersist<any>[];
  [SSP_FIELDS.STATUS]: SuperSubStatus;
}

export const SUPER_SUB_ID = "super-sub";

class SuperSubMaster extends ZyMaster {
  zyId: string = SUPER_SUB_ID;

  newBlankChild(): Zym<any, any, any> {
    return new SuperSubZymbol(DUMMY_FRAME, 0, undefined);
  }
}

export const superSubMaster = new SuperSubMaster();

extendZymbol(superSubMaster);

enum SuperSubStatus {
  Neither,
  OnlySub,
  OnlySuper,
  Both,
}

export class SuperSubZymbol extends Zymbol<SuperSubPersist> {
  /* Super goes after sub */
  children: Zymbol[] = [];
  zyMaster: ZyMaster = superSubMaster;
  status: SuperSubStatus = SuperSubStatus.Neither;

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

    const newOpts = { ...opts, cursor: childRelativeCursor };

    switch (this.status) {
      case SuperSubStatus.Neither: {
        return "";
      }
      case SuperSubStatus.Both: {
        return `_{${this.children[1].renderTex({
          ...opts,
          cursor: nextCursorIndex === 1 ? childRelativeCursor : [],
        })}}^{${this.children[0].renderTex({
          ...opts,
          cursor: nextCursorIndex === 0 ? childRelativeCursor : [],
        })}}`;
      }
      case SuperSubStatus.OnlySub: {
        return `_{${this.children[0].renderTex(newOpts)}}`;
      }
      case SuperSubStatus.OnlySuper: {
        return `^{${this.children[0].renderTex(newOpts)}}`;
      }
    }
  };

  persistData(): SuperSubPersist {
    return {
      [SSP_FIELDS.CHILDREN]: this.children.map((c) => c.persist()),
      [SSP_FIELDS.STATUS]: this.status,
    };
  }

  async hydrate(p: Partial<SuperSubPersist>): Promise<void> {
    await safeHydrate(p, {
      [SSP_FIELDS.CHILDREN]: async (children) => {
        this.children = (await Promise.all(
          children.map((c) => hydrateChild(this, c))
        )) as Zymbol[];
      },
      [SSP_FIELDS.STATUS]: (s) => {
        this.status = s;
      },
    });

    this.reConnectParentChildren();
  }
}
