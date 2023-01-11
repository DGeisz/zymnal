import { palette } from "../../../../../global_styles/palette";
import { add_latex_color } from "../../../../../global_utils/latex_utils";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  NO_CURSOR_MOVE_RESPONSE,
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
import { SNIPPET_MODAL_ID } from "../../../zymbol_infrastructure/zymbol_module/snippets/snippet_modal_schema";
import {
  DeleteBehavior,
  DeleteBehaviorType,
  deleteBehaviorNormal,
} from "../../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../../zymbol";
import {
  SNIPPET_PLACEHOLDER_ID,
  SnippetPlaceholderSchema,
} from "./snippet_placeholder_schema";

class SnippetPlaceholderMaster extends ZyMaster<SnippetPlaceholderSchema> {
  zyId = SNIPPET_PLACEHOLDER_ID;

  newBlankChild() {
    return new SnippetPlaceholder(0, DUMMY_FRAME, 0, undefined);
  }
}

export const snippetPlaceholderMaster = new SnippetPlaceholderMaster();

export class SnippetPlaceholder extends Zymbol<SnippetPlaceholderSchema> {
  zyMaster = snippetPlaceholderMaster;
  children = [];
  label: number;

  constructor(
    label: number,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zymbol | undefined
  ) {
    super(parentFrame, cursorIndex, parent);

    this.label = label;
    this.setPersistenceSchemaSymbols({
      label: "l",
    });
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

  renderTex(_opts: ZymbolRenderArgs): string {
    return add_latex_color(`\\$${this.label}`, palette.quasiLightForestGreen);
  }

  persistData(): ZyPartialPersist<SnippetPlaceholderSchema> {
    return {
      label: this.label,
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<SnippetPlaceholderSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      label: (l) => {
        this.label = l;
      },
    });
  }

  getRefreshedChildrenPointer(): Zym[] {
    return this.children;
  }
}
