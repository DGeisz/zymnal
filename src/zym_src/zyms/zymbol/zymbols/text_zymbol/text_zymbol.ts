import { palette } from "../../../../../global_styles/palette";
import {
  add_latex_color,
  create_tex_text,
  cursorToString,
  text_with_cursor,
  wrapHtmlId,
} from "../../../../../global_utils/latex_utils";
import { safeHydrate } from "../../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { ZymbolDirection } from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import { addZymChangeLink } from "../../../../../zym_lib/zy_god/undo_redo/undo_redo";
import { getFullContextCursor } from "../../../../../zym_lib/zy_god/zy_god";
import { DUMMY_FRAME } from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  deflectDeleteBehavior,
  DeleteBehaviorType,
  deleteBehaviorNormal,
} from "../../delete_behavior";
import {
  basicZymbolHtmlIdImplementation,
  Zymbol,
  ZymbolHtmlIdTrait,
  ZymbolRenderArgs,
} from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";

const TZP_FIELDS: { CHARACTERS: "c" } = {
  CHARACTERS: "c",
};

export interface TextZymbolPersist {
  [TZP_FIELDS.CHARACTERS]: string[];
}

export const TEXT_ZYMBOL_NAME = "text";

class TextZymbolMaster extends ZyMaster {
  zyId: string = TEXT_ZYMBOL_NAME;

  newBlankChild(): Zym<any, any, any> {
    return new TextZymbol(DUMMY_FRAME, 0, undefined);
  }
}

export const textZymbolMaster = new TextZymbolMaster();

/* Extensions */
extendZymbol(textZymbolMaster);

export class TextZymbol extends Zymbol<TextZymbolPersist> {
  private characters: string[] = [];

  children: Zymbol[] = [];
  zyMaster: ZyMaster = textZymbolMaster;

  /* Zymbol Methods  */

  moveCursorLeft = (cursor: Cursor): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      if (nextCursorIndex > 1) {
        return {
          success: true,
          newRelativeCursor: [nextCursorIndex - 1],
        };
      } else {
        return {
          success: false,
          newRelativeCursor: [],
        };
      }
    } else {
      return {
        success: false,
        newRelativeCursor: [],
      };
    }
  };

  moveCursorRight = (cursor: Cursor): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      if (nextCursorIndex < this.characters.length - 1) {
        return {
          success: true,
          newRelativeCursor: [nextCursorIndex + 1],
        };
      } else {
        return {
          success: false,
          newRelativeCursor: [],
        };
      }
    } else {
      return {
        success: false,
        newRelativeCursor: [],
      };
    }
  };

  takeCursorFromLeft = (): CursorMoveResponse => {
    if (this.characters.length > 1) {
      return successfulMoveResponse(1);
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  takeCursorFromRight = (): CursorMoveResponse => {
    if (this.characters.length > 1) {
      return successfulMoveResponse(this.characters.length - 1);
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  moveCursorUp(_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }
  captureArrowUp(
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }
  moveCursorDown(_cursor: Cursor, _ctx: BasicContext): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }
  captureArrowDown(
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

  private _addZymChangeLink = (
    ctx: BasicContext,
    beforeChars: string[],
    afterChars: string[]
  ) => {
    addZymChangeLink(ctx, {
      zymLocation: this.getFullCursorPointer(),
      beforeChange: {
        renderOpts: { cursor: [] },
        zymState: {
          [TZP_FIELDS.CHARACTERS]: beforeChars,
        },
      },
      afterChange: {
        renderOpts: { cursor: [] },
        zymState: {
          [TZP_FIELDS.CHARACTERS]: afterChars,
        },
      },
    });
  };

  addCharacter = (character: string, cursor: Cursor, ctx: BasicContext) => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      const beforeChars = [...this.characters];
      this.characters.splice(nextCursorIndex, 0, character);

      const newCursorIndex = Math.min(
        nextCursorIndex + 1,
        this.characters.length
      );

      this._addZymChangeLink(ctx, beforeChars, [...this.characters]);

      return successfulMoveResponse(newCursorIndex);
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  getDeleteBehavior = () => {
    if (this.characters.length > 1) {
      return deflectDeleteBehavior(
        deleteBehaviorNormal(DeleteBehaviorType.ALLOWED)
      );
    }

    return deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);
  };

  delete = (cursor: Cursor, ctx: BasicContext) => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      if (nextCursorIndex === 0) {
        return FAILED_CURSOR_MOVE_RESPONSE;
      }

      const fullCursor = getFullContextCursor(ctx);
      const afterCursor = [...fullCursor];
      afterCursor.splice(afterCursor.length - 1, 1, nextCursorIndex - 1);

      const beforeChars = [...this.characters];

      this.characters.splice(nextCursorIndex - 1, 1);

      this._addZymChangeLink(ctx, beforeChars, [...this.characters]);

      return successfulMoveResponse(nextCursorIndex - 1);
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  deflectDelete = (ctx: BasicContext) => {
    if (this.characters.length > 1) {
      const before = [...this.characters];
      this.characters.pop();
      const after = [...this.characters];

      this._addZymChangeLink(ctx, before, after);

      return true;
    }

    return false;
  };

  renderTex = (opts: ZymbolRenderArgs) => {
    const { parentOfCursorElement, nextCursorIndex } = extractCursorInfo(
      opts.cursor
    );

    const { excludeHtmlIds } = opts;

    const finalTex = add_latex_color(() => {
      if (parentOfCursorElement) {
        return text_with_cursor(this.characters.join(""), nextCursorIndex);
      } else {
        return create_tex_text(this.characters.join(""));
      }
    }, palette.deepBlue);

    if (excludeHtmlIds) {
      return finalTex;
    } else {
      return wrapHtmlId(finalTex, cursorToString(this.getFullCursorPointer()));
    }
  };

  persistData(): TextZymbolPersist {
    return {
      [TZP_FIELDS.CHARACTERS]: [...this.characters],
    };
  }

  hydrate = async (p: Partial<TextZymbolPersist>): Promise<void> => {
    await safeHydrate(p, {
      [TZP_FIELDS.CHARACTERS]: (c) => {
        this.characters = c;
      },
    });
  };

  /* Custom methods */
  getCharacters = () => this.characters;
  setCharacters = (characters: string[]) => {
    this.characters = characters;
  };

  getText = () => this.characters.join("");
  setText = (text: string) => {
    this.setCharacters(text.split(""));
  };
}

textZymbolMaster.implementTrait(
  ZymbolHtmlIdTrait,
  basicZymbolHtmlIdImplementation
);
