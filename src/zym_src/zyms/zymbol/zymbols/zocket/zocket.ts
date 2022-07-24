import { last } from "../../../../../global_utils/array_utils";
import { CURSOR_LATEX } from "../../../../../global_utils/latex_utils";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  implementPartialCmdGroup,
  some,
} from "../../../../../zym_lib/zy_commands/zy_command_types";
import {
  chainMoveResponse,
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extendChildCursor,
  extendParentCursor,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  successfulMoveResponse,
  wrapChildCursorResponse,
} from "../../../../../zym_lib/zy_god/cursor/cursor";
import {
  CursorCommand,
  GetInitialCursorReturn,
} from "../../../../../zym_lib/zy_god/cursor/cursor_commands";
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

export const ZOCKET_MASTER_ID = "zocket";

class ZocketMaster extends ZyMaster {
  zyId = ZOCKET_MASTER_ID;
}

export const zocketMaster = new ZocketMaster();

/* Extensions */
extendZymbol(zocketMaster);

export class Zocket extends Zymbol<{}> {
  zyMaster: ZyMaster = zocketMaster;
  children: Zymbol[] = [];

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

  clone = (newParent?: Zym) => {
    const newZocket = new Zocket(
      this.isBaseZocket,
      this.parentFrame,
      this.getCursorIndex(),
      newParent ?? this.parent
    );

    newZocket.children = this.cloneChildren(newZocket) as Zymbol[];

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
        this.children[nextCursorIndex - 1].takeCursorFromRight();

      if (success) {
        return successfulMoveResponse([
          nextCursorIndex - 1,
          ...newRelativeCursor,
        ]);
      } else {
        return successfulMoveResponse([nextCursorIndex - 1]);
      }
    } else {
      const { success, newRelativeCursor } = this.children[
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
      if (this.children.length > 1) {
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
    if (parentOfCursorElement && nextCursorIndex === this.children.length) {
      return {
        success: false,
        newRelativeCursor: [],
      };
    }

    const cursorZymbol = this.children[nextCursorIndex];

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
        newRelativeCursor: [this.children.length],
      };
    } else {
      if (this.children.length > 1) {
        return {
          success: true,
          newRelativeCursor: [this.children.length - 1],
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

      this.children.splice(nextCursorIndex, 0, newZymbol);

      return this.mergeTextZymbols([nextCursorIndex, 1]);
    } else {
      const nextZymbol = this.children[nextCursorIndex] as Zymbol;

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

  private mergeTextZymbols = (cursor: Cursor): CursorMoveResponse => {
    let currentZymbolIndex = 0;
    let [cursor0, cursor1] = cursor;

    const { childRelativeCursor } = extractCursorInfo(cursor);

    let modifiedCursor1 = false;

    while (true) {
      /* First find the next text zymbol or the end of the list */
      if (currentZymbolIndex >= this.children.length - 1) {
        break;
      } else if (
        this.children[currentZymbolIndex].getMasterId() !== TEXT_ZYMBOL_NAME
      ) {
        currentZymbolIndex++;
      } else {
        /* Now we've found the beginning of the list of text zymbols, so we want to find where the list ends */
        let endOfTextZymbols = currentZymbolIndex + 1;

        while (true) {
          if (endOfTextZymbols >= this.children.length) {
            break;
          } else if (
            this.children[endOfTextZymbols].getMasterId() === TEXT_ZYMBOL_NAME
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
              const iChars = (this.children[i] as TextZymbol).getCharacters();

              if (i < cursor0) {
                newCursor1PreSize += iChars.length;
              }

              newCharacters = newCharacters.concat(
                (this.children[i] as TextZymbol).getCharacters()
              );
            }

            modifiedCursor1 = true;
            if (cursor1 === undefined) cursor1 = 0;

            cursor1 += newCursor1PreSize;

            (this.children[currentZymbolIndex] as TextZymbol).setCharacters(
              newCharacters
            );

            this.children.splice(
              currentZymbolIndex + 1,
              endOfTextZymbols - currentZymbolIndex - 1
            );

            cursor0 = currentZymbolIndex;
          } else {
            let newCharacters: string[] = [];

            for (let i = currentZymbolIndex; i < endOfTextZymbols; i++) {
              newCharacters = newCharacters.concat(
                (this.children[i] as TextZymbol).getCharacters()
              );
            }

            (this.children[currentZymbolIndex] as TextZymbol).setCharacters(
              newCharacters
            );

            this.children.splice(
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

    return successfulMoveResponse(
      modifiedCursor1
        ? [cursor0, cursor1]
        : extendChildCursor(cursor0, childRelativeCursor)
    );
  };

  getDeleteBehavior = (): DeleteBehavior => {
    if (this.children.length > 1) {
      return deflectDeleteBehavior(last(this.children).getDeleteBehavior());
    } else {
      return normalDeleteBehavior(DeleteBehaviorType.ALLOWED);
    }
  };

  renderTex = (opts: ZymbolRenderArgs) => {
    const { cursor } = opts;

    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    let finalTex = "";

    if (parentOfCursorElement && this.children.length === 0) {
      return CURSOR_LATEX;
    }

    for (let i = 0; i < this.children.length; i++) {
      if (parentOfCursorElement) {
        if (i === nextCursorIndex) {
          finalTex += CURSOR_LATEX;
        }

        finalTex += this.children[i].renderTex({ cursor: [] });
      } else {
        finalTex += this.children[i].renderTex({
          cursor: i === nextCursorIndex ? childRelativeCursor : [],
        });
      }
    }

    if (parentOfCursorElement && nextCursorIndex === this.children.length) {
      finalTex += CURSOR_LATEX;
    }

    return finalTex;
  };

  delete = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    /* Check if the immediate child is a text element */

    if (parentOfCursorElement) {
      if (nextCursorIndex === 0) {
        return FAILED_CURSOR_MOVE_RESPONSE;
      }

      const zymbol = this.children[nextCursorIndex - 1];

      const deleteBehavior = zymbol.getDeleteBehavior();

      const deleteZymbol = () => {
        this.children.splice(nextCursorIndex - 1, 1);

        return this.mergeTextZymbols([nextCursorIndex - 1]);

        // return successfulMoveResponse(nextCursorIndex - 1);
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
      const child = this.children[nextCursorIndex];

      return chainMoveResponse(
        child.delete(childRelativeCursor, ctx),
        (newRelativeCursor) => {
          /* We need to clean text zymbols up */
          let nextChildPointer = nextCursorIndex;

          /* First check if we're pointing to an empty text zymbol */
          if (
            child.getMasterId() === TEXT_ZYMBOL_NAME &&
            (child as TextZymbol).getCharacters().length === 0
          ) {
            /* Simply ensure that it isn't pointing inside the child */
            newRelativeCursor = [];
          }

          /* Now we're going to get rid of the empty text zymbols */
          for (let i = 0; i < this.children.length; i++) {
            const c = this.children[i];

            if (
              c.getMasterId() === TEXT_ZYMBOL_NAME &&
              (c as TextZymbol).getCharacters().length === 0
            ) {
              this.children.splice(i, 1);

              if (i < nextChildPointer) {
                nextChildPointer--;
              }
            }
          }

          return this.mergeTextZymbols(
            extendChildCursor(nextChildPointer, newRelativeCursor)
          );
        }
      );
    }

    return FAILED_CURSOR_MOVE_RESPONSE;
  };

  persist(): {} {
    return {};
  }

  hydrate(_persisted: {}): void {}
}

const zocketCursorImpl = implementPartialCmdGroup(CursorCommand, {
  getInitialCursor: (): GetInitialCursorReturn => some([0]),
});

zocketMaster.registerCmds([...zocketCursorImpl]);
