import { last } from "../../../../../global_utils/array_utils";
import { CURSOR_LATEX } from "../../../../../global_utils/latex_utils";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  chainMoveResponse,
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extendChildCursor,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
  wrapChildCursorResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import { BasicContext } from "../../../../../zym_lib/zy_god/types/context_types";
import { ZymbolFrame } from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  deflectDeleteBehavior,
  DeleteBehavior,
  DeleteBehaviorType,
  normalDeleteBehavior,
} from "../../delete_behavior";
import { Zymbol, ZymbolRenderArgs } from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { TEXT_ZYMBOL_NAME, TextZymbol } from "../text_zymbol/text_zymbol";
import { zocketCursorImpl } from "./cmd/zocket_cursor";

export const ZOCKET_MASTER_ID = "zocket";

class ZocketMaster extends ZyMaster {
  zyId = ZOCKET_MASTER_ID;
}

export const zocketMaster = new ZocketMaster();

/* Extensions */
extendZymbol(zocketMaster);

zocketMaster.registerCmds([...zocketCursorImpl]);

export class Zocket extends Zymbol<{}> {
  zyMaster: ZyMaster = zocketMaster;
  children: Zymbol[] = [];

  private zymbols: Zymbol[] = [];

  /* Indicates whether this is the zocket that's directly connected to the main controller, ie
  is at the base of the zymbol tree  */
  private isBaseZocket: boolean;

  constructor(
    isBaseZocket: boolean,
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined,
    persisted?: {}
  ) {
    super(parentFrame, cursorIndex, parent, persisted);
    this.isBaseZocket = isBaseZocket;
  }

  clone = () => {
    const newZocket = new Zocket(
      this.isBaseZocket,
      this.parentFrame,
      this.getCursorIndex(),
      this.parent
    );

    newZocket.children = this.cloneChildren() as Zymbol[];

    return newZocket;
  };

  /* USED ONLY FOR TESTS */
  getZymbols = () => this.children;
  setZymbols = (zymbols: Zymbol[]) => (this.children = zymbols);

  moveCursorLeft = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
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
        return successfulMoveResponse([
          nextCursorIndex - 1,
          ...newRelativeCursor,
        ]);
      } else {
        return successfulMoveResponse([nextCursorIndex - 1]);
      }
    } else {
      const { success, newRelativeCursor } = this.zymbols[
        nextCursorIndex
      ].moveCursorLeft(childRelativeCursor, ctx);

      if (success) {
        return successfulMoveResponse([nextCursorIndex, ...newRelativeCursor]);
      } else {
        return successfulMoveResponse([nextCursorIndex]);
      }
    }
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

  moveCursorRight = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
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
      : cursorZymbol.moveCursorRight(childRelativeCursor, ctx);

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

  addCharacter = (
    character: string,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      /* If we're the parent, then we basically just add a new text symbol at the current index, 
      and then we make sure that we merge all of our text symbols */
      // const newZymbol = new TextZymbol(this);
      const newZymbol = new TextZymbol(this.parentFrame, nextCursorIndex, this);
      newZymbol.addCharacter(character, [0]);

      this.zymbols.splice(nextCursorIndex, 0, newZymbol);

      return this.mergeTextZymbols([nextCursorIndex, 1]);
    } else {
      const nextZymbol = this.zymbols[nextCursorIndex] as Zymbol;

      return chainMoveResponse(
        nextZymbol.addCharacter(character, childRelativeCursor, ctx),
        (newRelCursor) =>
          successfulMoveResponse(
            extendChildCursor(nextCursorIndex, newRelCursor)
          )
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
        this.zymbols[currentZymbolIndex].getMasterId() !== TEXT_ZYMBOL_NAME
      ) {
        currentZymbolIndex++;
      } else {
        /* Now we've found the beginning of the list of text zymbols, so we want to find where the list ends */
        let endOfTextZymbols = currentZymbolIndex + 1;

        while (true) {
          if (endOfTextZymbols >= this.zymbols.length) {
            break;
          } else if (
            this.zymbols[endOfTextZymbols].getMasterId() === TEXT_ZYMBOL_NAME
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

    this.reIndexChildren();

    return successfulMoveResponse([cursor0, cursor1]);
  };

  getDeleteBehavior: () => DeleteBehavior = () => {
    if (this.zymbols.length > 0) {
      return deflectDeleteBehavior(last(this.zymbols).getDeleteBehavior());
    } else {
      return normalDeleteBehavior(DeleteBehaviorType.ALLOWED);
    }
  };

  renderTex = (opts: ZymbolRenderArgs) => {
    const { cursor } = opts;

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

        finalTex += this.zymbols[i].renderTex({ cursor: [] });
      } else {
        finalTex += this.zymbols[i].renderTex({
          cursor: i === nextCursorIndex ? childRelativeCursor : [],
        });
      }
    }

    if (parentOfCursorElement && nextCursorIndex === this.zymbols.length) {
      finalTex += CURSOR_LATEX;
    }

    return finalTex;
  };

  delete = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
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
              zymbol.delete(relCursor.newRelativeCursor, ctx),
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
        this.zymbols[nextCursorIndex].delete(childRelativeCursor, ctx),
        nextCursorIndex
      );
    }

    return FAILED_CURSOR_MOVE_RESPONSE;
  };

  persist(): {} {
    return {};
  }

  hydrate(_persisted: {}): void {}
}
