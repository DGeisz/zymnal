import {
  create_tex_text,
  text_with_cursor,
} from "../../../../../global_utils/latex_utils";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  Cursor,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import {
  deflectDeleteBehavior,
  DeleteBehaviorType,
  normalDeleteBehavior,
} from "../../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";

export const TEXT_ZYMBOL_NAME = "text";

class TextZymbolMaster extends ZyMaster {
  zyId: string = TEXT_ZYMBOL_NAME;
}

export const textZymbolMaster = new TextZymbolMaster();

/* Extensions */
extendZymbol(textZymbolMaster);

export class TextZymbol extends Zymbol<{}> {
  private characters: string[] = [];

  children: Zym<any, any>[] = [];
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

  addCharacter = (character: string, cursor: Cursor) => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      this.characters.splice(nextCursorIndex, 0, character);

      return successfulMoveResponse(
        Math.min(nextCursorIndex + 1, this.characters.length)
      );
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  getDeleteBehavior = () => {
    if (this.characters.length > 1) {
      return deflectDeleteBehavior(
        normalDeleteBehavior(DeleteBehaviorType.ALLOWED)
      );
    }
    return normalDeleteBehavior(DeleteBehaviorType.ALLOWED);
  };

  delete = (cursor: Cursor) => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      if (nextCursorIndex === 0) {
        return FAILED_CURSOR_MOVE_RESPONSE;
      }

      this.characters.splice(nextCursorIndex - 1, 1);

      return successfulMoveResponse(nextCursorIndex - 1);
    } else {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }
  };

  renderTex = (opts: ZymbolRenderArgs) => {
    const { parentOfCursorElement, nextCursorIndex } = extractCursorInfo(
      opts.cursor
    );

    if (parentOfCursorElement) {
      return text_with_cursor(this.characters.join(""), nextCursorIndex);
    } else {
      return create_tex_text(this.characters.join(""));
    }
  };

  persist(): {} {
    return {};
  }

  hydrate(_persisted: {}): void {
    throw new Error("Method not implemented.");
  }

  clone = () => {
    const newText = new TextZymbol(
      this.parentFrame,
      this.getCursorIndex(),
      this.parent
    );

    newText.setCharacters(this.characters);

    return newText;
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
