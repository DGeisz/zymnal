import { HiAtSymbol } from "react-icons/hi";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  NO_CURSOR_MOVE_RESPONSE,
  getRelativeCursor,
  getZymAtId,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { ZymbolDirection } from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { ZyPartialPersist } from "../../../../../zym_lib/zy_schema/zy_schema";
import { safeHydrate } from "../../../../../zym_lib/zym/utils/hydrate";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import { Zym } from "../../../../../zym_lib/zym/zym";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  DeleteBehaviorType,
  deleteBehaviorNormal,
} from "../../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { REF_ZYMBOL_ID, RefZymbolSchema } from "./ref_zymbol_schema";

class RefZymbolMaster extends ZyMaster<RefZymbolSchema> {
  zyId = REF_ZYMBOL_ID;

  newBlankChild() {
    return new RefZymbol([], DUMMY_FRAME, 0, undefined);
  }
}

export const refZymbolMaster = new RefZymbolMaster();

extendZymbol(refZymbolMaster);

export class RefZymbol extends Zymbol<RefZymbolSchema> {
  zyMaster = refZymbolMaster;
  zymbolRef: Cursor;

  children = [];

  constructor(
    zymbolRef: Cursor,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zymbol | undefined
  ) {
    super(parentFrame, cursorIndex, parent);
    this.zymbolRef = zymbolRef;
  }

  moveCursorLeft = (_cursor: Cursor) => NO_CURSOR_MOVE_RESPONSE;
  takeCursorFromLeft = () => NO_CURSOR_MOVE_RESPONSE;
  moveCursorRight = (_cursor: Cursor) => NO_CURSOR_MOVE_RESPONSE;
  takeCursorFromRight = () => NO_CURSOR_MOVE_RESPONSE;

  moveCursorUp = (_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse =>
    NO_CURSOR_MOVE_RESPONSE;
  captureArrowUp = (
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse => NO_CURSOR_MOVE_RESPONSE;
  moveCursorDown = (_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse =>
    NO_CURSOR_MOVE_RESPONSE;
  captureArrowDown = (
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse => NO_CURSOR_MOVE_RESPONSE;

  addCharacter = (_character: string, _cursor: Cursor) =>
    NO_CURSOR_MOVE_RESPONSE;

  getDeleteBehavior = () => deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);

  delete(_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse {
    return NO_CURSOR_MOVE_RESPONSE;
  }

  renderTex(opts: ZymbolRenderArgs): string {
    const baseZocketRelativeRenderCursor = opts.baseZocketRelativeCursor;
    const refRelativeCursorOp = getRelativeCursor(
      this.zymbolRef,
      baseZocketRelativeRenderCursor
    );

    let refRelativeCursor: Cursor = [];

    if (refRelativeCursorOp.some) {
      refRelativeCursor = refRelativeCursorOp.val;
    }

    const referencedZymbol = getZymAtId(
      this.parentFrame.baseZocket,
      this.zymbolRef
    ) as Zymbol;

    if (!referencedZymbol) throw new Error("Bad reference!");

    return referencedZymbol.renderTex({ ...opts, cursor: refRelativeCursor });
  }

  persistData(): ZyPartialPersist<RefZymbolSchema> {
    return {
      zymbolRef: [...this.zymbolRef],
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<RefZymbolSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      zymbolRef: (z) => {
        this.zymbolRef = [...z];
      },
    });
  }

  getRefreshedChildrenPointer() {
    return this.children;
  }
}
