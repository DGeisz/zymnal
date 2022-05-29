import { Cursor, CursorMoveResponse, extractCursorInfo } from "../cursor";
import { create_tex_text, text_with_cursor } from "../utils/latex_utils";
import { Zymbol } from "../zymbol";

export const TEXT_ZYMBOL_NAME = "text";

export class TextZymbol extends Zymbol {
  characters: string[] = [];

  getName = () => TEXT_ZYMBOL_NAME;
  getCharacters = () => this.characters;
  setCharacters = (characters: string[]) => {
    this.characters = characters;
  };

  moveCursorLeft = (cursor: Cursor): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      if (nextCursorIndex > 0) {
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
      if (nextCursorIndex < this.characters.length) {
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
    return {
      success: true,
      newRelativeCursor: [0],
    };
  };

  takeCursorFromRight = (): CursorMoveResponse => {
    return {
      success: true,
      newRelativeCursor: [this.characters.length],
    };
  };

  addCharacter = (character: string, cursor: Cursor) => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      this.characters.splice(nextCursorIndex, 0, character);
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
  };

  renderTex = (cursor: Cursor) => {
    const { parentOfCursorElement, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      return text_with_cursor(this.characters.join(""), nextCursorIndex);
    } else {
      return create_tex_text(this.characters.join(""));
    }
  };
}
