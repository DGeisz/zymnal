import {
  Cursor,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
} from "../../cursor";
import { create_tex_text, text_with_cursor } from "../../utils/latex_utils";
import { Zymbol } from "../zymbol";
import {
  BasicZymbolEvent,
  zymbolEventHandler,
} from "../../zymbol_event_handler/zymbol_event_handler";
import {
  deflectDeleteBehavior,
  DeleteBehaviorType,
  normalDeleteBehavior,
} from "../delete_behavior";

export const TEXT_ZYMBOL_NAME = "text";

export class TextZymbol extends Zymbol {
  private characters: string[] = [];

  getName = () => TEXT_ZYMBOL_NAME;
  getCharacters = () => this.characters;
  setCharacters = (characters: string[]) => {
    this.characters = characters;
  };

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

      zymbolEventHandler.triggerEvent(
        BasicZymbolEvent.ZOCKET_CONTENT_ADDED,
        this.parentZymbol
      );

      return {
        success: true,
        newRelativeCursor: [
          Math.min(nextCursorIndex + 1, this.characters.length),
        ],
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
}
