import { last } from "../../../global_utils/array_utils";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
  wrapChildCursorResponse,
} from "../../cursor";
import { CURSOR_LATEX } from "../../utils/latex_utils";
import {
  deflectDeleteBehavior,
  DeleteBehaviorType,
  normalDeleteBehavior,
} from "../delete_behavior";
import { Zymbol } from "../zymbol";
import { TextZymbol, TEXT_ZYMBOL_NAME } from "./text_zymbol";

export const ZOCKET_NAME = "zocket";

export class Zocket extends Zymbol {
  private zymbols: Zymbol[] = [];
  /* Indicates whether this is the zocket that's directly connected to the main controller, ie
  is at the base of the zymbol tree  */
  private isBaseZocket: boolean;

  constructor(parentZymbol?: Zymbol, isBaseZocket?: boolean) {
    super(parentZymbol);
    this.isBaseZocket = !!isBaseZocket;
  }

  /* USED ONLY FOR TESTS */
  getZymbols = () => this.zymbols;
  setZymbols = (zymbols: Zymbol[]) => (this.zymbols = zymbols);

  getName = () => ZOCKET_NAME;

  moveCursorLeft = (cursor: Cursor): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement && nextCursorIndex === 0) {
      return {
        success: false,
        newRelativeCursor: [],
      };
    }

    if (parentOfCursorElement) {
      const { success, newRelativeCursor } =
        this.zymbols[nextCursorIndex - 1].takeCursorFromRight();

      if (success) {
        return {
          success: true,
          newRelativeCursor: [nextCursorIndex - 1, ...newRelativeCursor],
        };
      } else {
        return {
          success: true,
          newRelativeCursor: [nextCursorIndex - 1],
        };
      }
    } else {
      const { success, newRelativeCursor } =
        this.zymbols[nextCursorIndex].moveCursorLeft(childRelativeCursor);

      if (success) {
        return {
          success: true,
          newRelativeCursor: [nextCursorIndex, ...newRelativeCursor],
        };
      } else {
        return {
          success: true,
          newRelativeCursor: [nextCursorIndex],
        };
      }
    }
  };

  moveCursorRight = (cursor: Cursor): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    /* If we're at the end of the list, we automatically return lack of success */
    if (parentOfCursorElement && nextCursorIndex === this.zymbols.length) {
      return {
        success: false,
        newRelativeCursor: [],
      };
    }

    const cursorZymbol = this.zymbols[nextCursorIndex];

    const { success, newRelativeCursor } = parentOfCursorElement
      ? cursorZymbol.takeCursorFromLeft()
      : cursorZymbol.moveCursorRight(childRelativeCursor);

    if (success) {
      return {
        success: true,
        newRelativeCursor: [nextCursorIndex, ...newRelativeCursor],
      };
    } else {
      return {
        success: true,
        newRelativeCursor: [nextCursorIndex + 1],
      };
    }
  };

  delete = (cursor: Cursor): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      if (nextCursorIndex === 0) {
        return FAILED_CURSOR_MOVE_RESPONSE;
      }

      const zymbol = this.zymbols[nextCursorIndex - 1];

      const deleteBehavior = zymbol.getDeleteBehavior();

      const deleteZymbol = () => {
        this.zymbols.splice(nextCursorIndex - 1, 1);

        return successfulMoveResponse(nextCursorIndex - 1);
      };

      switch (deleteBehavior.type) {
        case DeleteBehaviorType.ABSORB: {
          const relCursor = zymbol.takeCursorFromRight();

          if (relCursor.success) {
            return wrapChildCursorResponse(
              zymbol.delete(relCursor.newRelativeCursor),
              nextCursorIndex - 1
            );
          } else {
            return FAILED_CURSOR_MOVE_RESPONSE;
          }
        }
        case DeleteBehaviorType.ALLOWED: {
          return deleteZymbol();
        }
        case DeleteBehaviorType.FORBIDDEN: {
          break;
        }
        case DeleteBehaviorType.UNPRIMED: {
          zymbol.primeDelete();
          break;
        }
        case DeleteBehaviorType.PRIMED: {
          return deleteZymbol();
        }
        case DeleteBehaviorType.DEFLECT: {
          const success = zymbol.deflectDelete();

          if (success) {
            return successfulMoveResponse(nextCursorIndex);
          } else {
            return FAILED_CURSOR_MOVE_RESPONSE;
          }
        }
      }
    } else {
      return wrapChildCursorResponse(
        this.zymbols[nextCursorIndex].delete(childRelativeCursor),
        nextCursorIndex
      );
    }

    return FAILED_CURSOR_MOVE_RESPONSE;
  };

  addCharacter = (character: string, cursor: Cursor): CursorMoveResponse => {
    console.log("zicket add", character);
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      /* If we're the parent, then we basically just add a new text symbol at the current index, 
      and then we make sure that we merge all of our text symbols */
      const newZymbol = new TextZymbol(this);
      newZymbol.addCharacter(character, [0]);

      this.zymbols.splice(nextCursorIndex, 0, newZymbol);

      return this.mergeTextZymbols([nextCursorIndex, 1]);
    } else {
      const nextZymbol = this.zymbols[nextCursorIndex];

      return this.handleChildCursorResponse(
        nextZymbol.addCharacter(character, childRelativeCursor),
        nextCursorIndex
      );
    }
  };

  __mergeTextZymbols = (currentCursor: [CursorIndex, CursorIndex]) =>
    this.mergeTextZymbols(currentCursor);

  private mergeTextZymbols = (
    currentCursor: [CursorIndex, CursorIndex]
  ): CursorMoveResponse => {
    let currentZymbolIndex = 0;
    let [cursor0, cursor1] = currentCursor;

    while (true) {
      /* First find the next text zymbol or the end of the list */
      if (currentZymbolIndex >= this.zymbols.length - 1) {
        break;
      } else if (
        this.zymbols[currentZymbolIndex].getName() !== TEXT_ZYMBOL_NAME
      ) {
        currentZymbolIndex++;
      } else {
        /* Now we've found the beginning of the list of text zymbols, so we want to find where the list ends */
        let endOfTextZymbols = currentZymbolIndex + 1;

        while (true) {
          if (endOfTextZymbols >= this.zymbols.length) {
            break;
          } else if (
            this.zymbols[endOfTextZymbols].getName() === TEXT_ZYMBOL_NAME
          ) {
            endOfTextZymbols++;
          } else {
            break;
          }
        }

        /* Ok, so now current zymbol index is at the beginning of the text zymbols, 
        and the end of text zymbols is at the end */
        if (endOfTextZymbols !== currentZymbolIndex + 1) {
          /* For now, we're going to handle in two separate cases the cursor  */

          if (cursor0 >= currentZymbolIndex && cursor0 < endOfTextZymbols) {
            let newCursor1PreSize = 0;
            let newCharacters: string[] = [];

            for (let i = currentZymbolIndex; i < endOfTextZymbols; i++) {
              const iChars = (this.zymbols[i] as TextZymbol).getCharacters();

              if (i < cursor0) {
                newCursor1PreSize += iChars.length;
              }

              newCharacters = newCharacters.concat(
                (this.zymbols[i] as TextZymbol).getCharacters()
              );
            }

            cursor1 += newCursor1PreSize;

            (this.zymbols[currentZymbolIndex] as TextZymbol).setCharacters(
              newCharacters
            );

            this.zymbols.splice(
              currentZymbolIndex + 1,
              endOfTextZymbols - currentZymbolIndex - 1
            );

            cursor0 = currentZymbolIndex;
          } else {
            let newCharacters: string[] = [];

            for (let i = currentZymbolIndex; i < endOfTextZymbols; i++) {
              newCharacters = newCharacters.concat(
                (this.zymbols[i] as TextZymbol).getCharacters()
              );
            }

            (this.zymbols[currentZymbolIndex] as TextZymbol).setCharacters(
              newCharacters
            );

            this.zymbols.splice(
              currentZymbolIndex + 1,
              endOfTextZymbols - currentZymbolIndex - 1
            );

            if (cursor0 > currentZymbolIndex) {
              cursor0 -= endOfTextZymbols - currentZymbolIndex - 1;
            }
          }
        }

        currentZymbolIndex++;
      }
    }

    return {
      success: true,
      newRelativeCursor: [cursor0, cursor1],
    };
  };

  private handleChildCursorResponse = (
    cursorResponse: CursorMoveResponse,
    cursorIndex: CursorIndex
  ): CursorMoveResponse => {
    if (cursorResponse.success) {
      return {
        success: true,
        newRelativeCursor: [cursorIndex, ...cursorResponse.newRelativeCursor],
      };
    } else {
      return {
        success: false,
        newRelativeCursor: [],
      };
    }
  };

  renderTex = (cursor: Cursor): string => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    let finalTex = "";

    if (parentOfCursorElement && this.zymbols.length === 0) {
      return CURSOR_LATEX;
    }

    for (let i = 0; i < this.zymbols.length; i++) {
      if (parentOfCursorElement) {
        if (i === nextCursorIndex) {
          finalTex += CURSOR_LATEX;
        }

        finalTex += this.zymbols[i].renderTex([]);
      } else {
        finalTex += this.zymbols[i].renderTex(
          i === nextCursorIndex ? childRelativeCursor : []
        );
      }
    }

    if (parentOfCursorElement && nextCursorIndex === this.zymbols.length) {
      finalTex += CURSOR_LATEX;
    }

    return finalTex;
  };

  takeCursorFromLeft = () => {
    /* This will behave differently if it's at the very base of everything */
    if (this.isBaseZocket) {
      return {
        success: true,
        newRelativeCursor: [0],
      };
    } else {
      if (this.zymbols.length > 1) {
        return {
          success: true,
          newRelativeCursor: [1],
        };
      } else {
        return FAILED_CURSOR_MOVE_RESPONSE;
      }
    }
  };

  takeCursorFromRight = () => {
    /* Behaves differently if this is the base zocket */
    if (this.isBaseZocket) {
      return {
        success: true,
        newRelativeCursor: [this.zymbols.length],
      };
    } else {
      if (this.zymbols.length > 1) {
        return {
          success: true,
          newRelativeCursor: [this.zymbols.length - 1],
        };
      } else {
        return FAILED_CURSOR_MOVE_RESPONSE;
      }
    }
  };

  getDeleteBehavior = () => {
    if (this.zymbols.length > 0) {
      return deflectDeleteBehavior(last(this.zymbols).getDeleteBehavior());
    } else {
      return normalDeleteBehavior(DeleteBehaviorType.ALLOWED);
    }
  };
}
