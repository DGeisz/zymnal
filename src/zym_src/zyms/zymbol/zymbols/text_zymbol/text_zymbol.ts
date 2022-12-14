import { palette } from "../../../../../global_styles/palette";
import {
  add_latex_color,
  create_tex_text,
  cursorToString,
  CURSOR_LATEX,
  wrapHtmlId,
} from "../../../../../global_utils/latex_utils";
import { safeHydrate } from "../../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  cursorBlink,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { ZymbolDirection } from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import { addZymChangeLink } from "../../../../../zym_lib/zy_god/undo_redo/undo_redo";
import { getFullContextCursor } from "../../../../../zym_lib/zy_god/zy_god";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  deflectDeleteBehavior,
  DeleteBehaviorType,
  deleteBehaviorNormal,
} from "../../delete_behavior";
import { Zymbol, ZymbolHtmlIdTrait, ZymbolRenderArgs } from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { TextZymbolSchema, TEXT_ZYMBOL_NAME } from "./text_zymbol_schema";
import { ZyPartialPersist } from "../../../../../zym_lib/zy_schema/zy_schema";
import { ZYMBOL_FRAME_MASTER_ID } from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame_schema";
import {
  createMathText,
  zyMath,
} from "../../../../../global_building_blocks/tex/autoRender";

class TextZymbolMaster extends ZyMaster<TextZymbolSchema> {
  zyId: string = TEXT_ZYMBOL_NAME;

  newBlankChild(): Zym<any, any, any> {
    return new TextZymbol(DUMMY_FRAME, 0, undefined);
  }
}

export function treatText(text: string, _inline: boolean) {
  return text;
}

export const textZymbolMaster = new TextZymbolMaster();

/* Extensions */
extendZymbol(textZymbolMaster);

export class TextZymbol extends Zymbol<TextZymbolSchema> {
  private characters: string[] = [];

  children: Zymbol[] = [];
  zyMaster = textZymbolMaster;

  lastRenderedCursorIndex = -1;

  constructor(
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(parentFrame, cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      characters: "c",
    });
  }

  /* Zymbol Methods  */

  private getLeftThreshold = () => (this.getInline() ? 0 : 1);

  moveCursorLeft = (cursor: Cursor): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      if (nextCursorIndex > this.getLeftThreshold()) {
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

  private getRightThreshold = () =>
    this.getInline() ? this.characters.length : this.characters.length - 1;

  moveCursorRight = (cursor: Cursor): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      if (nextCursorIndex < this.getRightThreshold()) {
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
    const thresh = this.getLeftThreshold();

    if (this.characters.length > thresh) {
      return successfulMoveResponse(thresh);
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  takeCursorFromRight = (): CursorMoveResponse => {
    // Hacky way to determine when we can take the cursor
    if (this.characters.length > this.getLeftThreshold()) {
      return successfulMoveResponse(this.getRightThreshold());
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

  checkForDomCursor = (cursor: Cursor) => {
    const { parentOfCursorElement } = extractCursorInfo(cursor);

    if (parentOfCursorElement) return this.getInline();

    return false;
  };

  private _addZymChangeLink = (
    ctx: BasicContext,
    beforeChars: string[],
    afterChars: string[]
  ) => {
    addZymChangeLink<TextZymbolSchema>(ctx, {
      zymLocation: this.getFullCursorPointer(),
      beforeChange: {
        renderOpts: { cursor: [] },
        zymState: {
          characters: beforeChars,
        },
      },
      afterChange: {
        renderOpts: { cursor: [] },
        zymState: {
          characters: afterChars,
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

      const fullCursor = getFullContextCursor(ctx)!;
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

  getInline = (opts?: ZymbolRenderArgs) =>
    (this.parentFrame.inlineTex || !!opts?.inlineTex) &&
    this.parent?.parent?.getMasterId() === ZYMBOL_FRAME_MASTER_ID;

  renderTex = (opts: ZymbolRenderArgs) => {
    const inline = this.getInline(opts);

    const { parentOfCursorElement, nextCursorIndex } = extractCursorInfo(
      opts.cursor
    );

    const { excludeHtmlIds } = opts;

    const chars = this.characters.join("");

    const treatedChars = treatText(chars, inline);

    const charSlice = (begin: number, end?: number) => {
      return treatText(chars.slice(begin, end), inline);
    };

    const internalTexCreator = () => {
      if (parentOfCursorElement) {
        this.lastRenderedCursorIndex = nextCursorIndex;

        if (excludeHtmlIds) {
          if (inline) {
            return `${charSlice(0, nextCursorIndex)}${zyMath(
              CURSOR_LATEX
            )}${charSlice(nextCursorIndex)}`;
          } else {
            return `${create_tex_text(
              charSlice(0, nextCursorIndex)
            )}${CURSOR_LATEX}${create_tex_text(charSlice(nextCursorIndex))}`;
          }
        } else {
          const fullCursor = this.getFullCursorPointer();

          if (inline) {
            if (opts.onlyUseLatexCaret) {
              return `${createMathText(
                charSlice(0, nextCursorIndex),
                cursorToString([...fullCursor, -1])
              )}${zyMath(CURSOR_LATEX)}${createMathText(
                charSlice(nextCursorIndex),
                cursorToString([...fullCursor, -2])
              )}`;
            } else {
              return createMathText(treatedChars, cursorToString(fullCursor));
            }
          } else {
            return `${wrapHtmlId(
              create_tex_text(charSlice(0, nextCursorIndex)),
              cursorToString([...fullCursor, -1])
            )}${CURSOR_LATEX}${wrapHtmlId(
              create_tex_text(charSlice(nextCursorIndex)),
              cursorToString([...fullCursor, -2])
            )}`;
          }
        }
      } else {
        this.lastRenderedCursorIndex = -1;

        if (inline) {
          if (excludeHtmlIds) {
            return treatedChars;
          } else {
            return createMathText(
              treatedChars,
              cursorToString(this.getFullCursorPointer())
            );
          }
        } else {
          const baseTex = create_tex_text(treatedChars);

          if (excludeHtmlIds) {
            return baseTex;
          } else {
            return wrapHtmlId(
              baseTex,
              cursorToString(this.getFullCursorPointer())
            );
          }
        }
      }
    };

    let finalTex;

    if (inline || opts.copyTex) {
      finalTex = internalTexCreator();
    } else {
      finalTex = add_latex_color(internalTexCreator, palette.deepBlue);
    }

    return finalTex;
  };

  persistData() {
    return {
      characters: [...this.characters],
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<TextZymbolSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      characters: (c) => {
        this.characters = c;
      },
    });
  }

  getRefreshedChildrenPointer(): Zym[] {
    return this.children;
  }

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

textZymbolMaster.implementTrait(ZymbolHtmlIdTrait, {
  async getAllDescendentHTMLIds(zym) {
    const pointer = zym.getFullCursorPointer();

    const nextPointer = [...pointer];

    if ((zym as TextZymbol).lastRenderedCursorIndex >= 0) {
      return [
        {
          loc: [...pointer, -1],
          clickCursor: nextPointer,
          isSelectableText: true,
          selectableOffset: 0,
        },
        {
          loc: [...pointer, -2],
          clickCursor: nextPointer,
          isSelectableText: true,
          selectableOffset: (zym as TextZymbol).lastRenderedCursorIndex,
        },
      ];
    } else {
      return [
        {
          loc: pointer,
          clickCursor: nextPointer,
          isSelectableText: true,
        },
      ];
    }
  },
});
