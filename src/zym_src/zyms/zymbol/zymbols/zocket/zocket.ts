import _ from "underscore";
import {
  cursorToString,
  CURSOR_LATEX,
  LATEX_EMPTY_SOCKET,
  wrapHtmlId,
} from "../../../../../global_utils/latex_utils";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../../zym_lib/zym/utils/hydrate";
import { Zym, ZymPersist } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import {
  implementPartialCmdGroup,
  some,
  unwrap,
} from "../../../../../zym_lib/zy_commands/zy_command_types";
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
import {
  CursorCommand,
  GetInitialCursorReturn,
} from "../../../../../zym_lib/zy_god/cursor/cursor_commands";
import {
  KeyPressModifier,
  ZymbolDirection,
} from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../../zym_lib/zy_god/types/context_types";
import { addZymChangeLink } from "../../../../../zym_lib/zy_god/undo_redo/undo_redo";
import { DUMMY_FRAME } from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  DeleteBehavior,
  DeleteBehaviorType,
  deleteBehaviorNormal,
} from "../../delete_behavior";
import {
  keyPressHasModifier,
  Zymbol,
  ZymbolHtmlClickInfo,
  ZymbolHtmlIdCommandGroup,
  ZymbolRenderArgs,
} from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { TeX } from "../../zymbol_types";
import { TEXT_ZYMBOL_NAME, TextZymbol } from "../text_zymbol/text_zymbol";

/* === Helper Types === */
export interface ZymbolModifier {
  id: {
    group: string;
    item: string | number;
  };
  pre: TeX;
  post: TeX;
}

/* === PERSIST === */
const ZP_FIELDS: {
  CHILDREN: "c";
  MODIFIERS: "m";
} = {
  CHILDREN: "c",
  MODIFIERS: "m",
};

export interface ZocketPersist {
  [ZP_FIELDS.CHILDREN]: ZymPersist<any>[];
  [ZP_FIELDS.MODIFIERS]: ZymbolModifier[];
}

export const ZOCKET_MASTER_ID = "zocket";

class ZocketMaster extends ZyMaster {
  zyId = ZOCKET_MASTER_ID;

  newBlankChild(): Zym<any, any, any> {
    return new Zocket(DUMMY_FRAME, 0, undefined);
  }
}

export const zocketMaster = new ZocketMaster();

/* Extensions */
extendZymbol(zocketMaster);

export class Zocket extends Zymbol<ZocketPersist> {
  zyMaster: ZyMaster = zocketMaster;
  children: Zymbol[] = [];
  modifiers: ZymbolModifier[] = [];

  /* USED ONLY FOR TESTS */
  getZymbols = () => this.children;
  setZymbols = (zymbols: Zymbol[]) => (this.children = zymbols);

  toggleModifier = (mod: ZymbolModifier) => {
    const hasMod = this.modifiers.some(
      (m) => m.id.group === mod.id.group && m.id.item === mod.id.item
    );

    if (hasMod) {
      this.removeModifier(mod);
    } else {
      this.addModifier(mod);
    }
  };

  addModifier = (mod: ZymbolModifier) => {
    this.modifiers.push(mod);
  };

  removeModifier = (mod: ZymbolModifier) => {
    this.modifiers = this.modifiers.filter(
      (m) => !(m.id.group === mod.id.group && m.id.item === mod.id.item)
    );
  };

  moveCursorLeft = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement && nextCursorIndex === 0) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    }

    if (parentOfCursorElement) {
      /* If we're holding down option, we skip past the children */
      if (keyPressHasModifier(ctx, KeyPressModifier.Option)) {
        return successfulMoveResponse([nextCursorIndex - 1]);
      }

      const { success, newRelativeCursor } =
        this.children[nextCursorIndex - 1].takeCursorFromRight(ctx);

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

  takeCursorFromLeft = (_ctx: BasicContext) => {
    return {
      success: true,
      newRelativeCursor: [0],
    };
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

    /* If we're holding down option, we skip past the children */
    if (
      parentOfCursorElement &&
      keyPressHasModifier(ctx, KeyPressModifier.Option)
    ) {
      return {
        success: true,
        newRelativeCursor: [nextCursorIndex + 1],
      };
    }

    const { success, newRelativeCursor } = parentOfCursorElement
      ? cursorZymbol.takeCursorFromLeft(ctx)
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

  takeCursorFromRight = (_ctx: BasicContext) => {
    return {
      success: true,
      newRelativeCursor: [this.children.length],
    };
  };

  moveCursorUp = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const { parentOfCursorElement, childRelativeCursor, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      if (nextCursorIndex === 0) {
        return wrapChildCursorResponse(
          this.children[0]?.captureArrowUp(ZymbolDirection.LEFT, ctx),
          0
        );
      } else if (nextCursorIndex === this.children.length) {
        return wrapChildCursorResponse(
          this.children[this.children.length - 1]?.captureArrowUp(
            ZymbolDirection.RIGHT,
            ctx
          ),
          this.children.length - 1
        );
      } else {
        /* Try right first, then left */
        const res = wrapChildCursorResponse(
          this.children[nextCursorIndex]?.captureArrowUp(
            ZymbolDirection.LEFT,
            ctx
          ),
          nextCursorIndex
        );

        if (res.success) return res;

        return wrapChildCursorResponse(
          this.children[nextCursorIndex - 1]?.captureArrowUp(
            ZymbolDirection.RIGHT,
            ctx
          ),
          nextCursorIndex - 1
        );
      }
    } else {
      return wrapChildCursorResponse(
        this.children[nextCursorIndex]?.moveCursorUp(childRelativeCursor, ctx),
        nextCursorIndex
      );
    }
  };

  captureArrowUp(
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

  moveCursorDown = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const { parentOfCursorElement, childRelativeCursor, nextCursorIndex } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement) {
      if (nextCursorIndex === 0) {
        return wrapChildCursorResponse(
          this.children[0]?.captureArrowDown(ZymbolDirection.LEFT, ctx),
          0
        );
      } else if (nextCursorIndex === this.children.length) {
        return wrapChildCursorResponse(
          this.children[this.children.length - 1]?.captureArrowDown(
            ZymbolDirection.RIGHT,
            ctx
          ),
          this.children.length - 1
        );
      } else {
        /* Try left first, then right */
        const res = wrapChildCursorResponse(
          this.children[nextCursorIndex - 1]?.captureArrowDown(
            ZymbolDirection.RIGHT,
            ctx
          ),
          nextCursorIndex - 1
        );

        if (res.success) return res;

        return wrapChildCursorResponse(
          this.children[nextCursorIndex]?.captureArrowDown(
            ZymbolDirection.LEFT,
            ctx
          ),
          nextCursorIndex
        );
      }
    } else {
      return wrapChildCursorResponse(
        this.children[nextCursorIndex]?.moveCursorDown(
          childRelativeCursor,
          ctx
        ),
        nextCursorIndex
      );
    }
  };

  captureArrowDown(
    _fromSide: ZymbolDirection,
    _ctx: BasicContext
  ): CursorMoveResponse {
    return FAILED_CURSOR_MOVE_RESPONSE;
  }

  _addZymChangeLinks = (
    ctx: BasicContext,
    beforeChildren: ZymPersist<any>[],
    afterChildren: ZymPersist<any>[]
  ) => {
    addZymChangeLink(ctx, {
      zymLocation: this.getFullCursorPointer(),
      beforeChange: {
        renderOpts: { cursor: [] },
        zymState: {
          [ZP_FIELDS.CHILDREN]: beforeChildren,
        },
      },
      afterChange: {
        renderOpts: { cursor: [] },
        zymState: {
          [ZP_FIELDS.CHILDREN]: afterChildren,
        },
      },
    });
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
      const newZymbol = new TextZymbol(this.parentFrame, nextCursorIndex, this);
      newZymbol.setText(character);

      const beforeChildren = this.children.map((c) => c.persist());

      this.children.splice(nextCursorIndex, 0, newZymbol);

      const mergedRes = this.mergeTextZymbols([nextCursorIndex, 1]);

      this._addZymChangeLinks(
        ctx,
        beforeChildren,
        this.children.map((c) => c.persist())
      );

      return mergedRes;
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

  onHandleKeyPress = (res: CursorMoveResponse): CursorMoveResponse => {
    if (!res.success) {
      return res;
    }

    const { nextCursorIndex, childRelativeCursor } = extractCursorInfo(
      res.newRelativeCursor
    );

    if (nextCursorIndex > -1) {
      /* We remove all the empty text zymbols */
      let i = 0;
      let nextIndex = nextCursorIndex;

      while (i < this.children.length) {
        const child = this.children[i];

        if (
          child.getMasterId() === TEXT_ZYMBOL_NAME &&
          !(child as TextZymbol).getText()
        ) {
          this.children.splice(i, 1);

          if (i < nextIndex) {
            nextIndex--;
          }
        } else {
          i++;
        }
      }

      return successfulMoveResponse(
        extendChildCursor(nextIndex, childRelativeCursor)
      );
    } else {
      return res;
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

    let finalCursor;

    if (modifiedCursor1) {
      finalCursor = [cursor0, cursor1];
    } else {
      finalCursor = extendChildCursor(cursor0, childRelativeCursor);
    }

    /* Check if we're pointing to the end of a text zymbol,
      and change the cursor if so */
    const child = this.children[cursor0];
    if (
      child &&
      child.getMasterId() === TEXT_ZYMBOL_NAME &&
      (child as TextZymbol).getCharacters().length === cursor1
    ) {
      finalCursor = [cursor0 + 1];
    }

    this.reIndexChildren();

    return successfulMoveResponse(finalCursor);
  };

  getDeleteBehavior = (): DeleteBehavior =>
    deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);

  renderTex = (opts: ZymbolRenderArgs) => {
    const { cursor, excludeHtmlIds } = opts;

    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    let finalTex = "";
    let emptySocket = false;

    if (this.children.length === 0 && !parentOfCursorElement) {
      finalTex = LATEX_EMPTY_SOCKET;
      emptySocket = true;
    } else {
      for (let i = 0; i < this.children.length; i++) {
        if (parentOfCursorElement) {
          if (i === nextCursorIndex) {
            finalTex += CURSOR_LATEX;
          }

          finalTex += this.children[i].renderTex({ ...opts, cursor: [] }) + " ";
        } else {
          finalTex +=
            this.children[i].renderTex({
              ...opts,
              cursor: i === nextCursorIndex ? childRelativeCursor : [],
            }) + " ";
        }
      }
    }

    if (parentOfCursorElement && nextCursorIndex === this.children.length) {
      finalTex += CURSOR_LATEX;
    }

    /* Now wrap this in all the modifiers */
    for (const mod of this.modifiers) {
      finalTex = `${mod.pre}${finalTex}${mod.post}`;
    }

    if (!excludeHtmlIds && emptySocket) {
      finalTex = wrapHtmlId(
        finalTex,
        cursorToString(this.getFullCursorPointer())
      );
    }

    return finalTex;
  };

  delete = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    /* Check if the immediate child is a text element */

    let childCursorIndex;
    let zymbol;
    let deleteBehavior;

    if (parentOfCursorElement) {
      if (nextCursorIndex === 0) {
        return FAILED_CURSOR_MOVE_RESPONSE;
      }

      childCursorIndex = nextCursorIndex - 1;
      zymbol = this.children[childCursorIndex];
      deleteBehavior = zymbol.getDeleteBehavior();
    } else if (nextCursorIndex > -1) {
      const db = this.children[
        nextCursorIndex
      ]?.letParentDeleteWithDeleteBehavior(childRelativeCursor, ctx);

      if (db) {
        deleteBehavior = db;
        zymbol = this.children[nextCursorIndex];
        childCursorIndex = nextCursorIndex;
      }
    }

    if (zymbol && deleteBehavior && childCursorIndex !== undefined) {
      switch (deleteBehavior.type) {
        case DeleteBehaviorType.ALLOWED: {
          const beforeChildren = this.children.map((c) => c.persist());

          this.children.splice(childCursorIndex, 1);
          const mergeRes = this.mergeTextZymbols([childCursorIndex]);

          this._addZymChangeLinks(
            ctx,
            beforeChildren,
            this.children.map((c) => c.persist())
          );

          return mergeRes;
        }
        case DeleteBehaviorType.SPLICE: {
          const res = zymbol.spliceDelete(childRelativeCursor, ctx);
          if (res) {
            const { zymbols: newChildren, putCursorAtEnd } = res;
            this.children.splice(childCursorIndex, 1, ...newChildren);

            return successfulMoveResponse(
              putCursorAtEnd
                ? childCursorIndex + newChildren.length
                : childCursorIndex
            );
          }

          break;
        }
        case DeleteBehaviorType.MOVE_LEFT: {
          return successfulMoveResponse(childCursorIndex);
        }
        case DeleteBehaviorType.ABSORB: {
          return wrapChildCursorResponse(
            zymbol.absorbCursor(ctx),
            childCursorIndex
          );
        }
        case DeleteBehaviorType.FORBIDDEN: {
          break;
        }
        case DeleteBehaviorType.DEFLECT: {
          const success = zymbol.deflectDelete(ctx);

          if (success) {
            return successfulMoveResponse(childCursorIndex + 1);
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

          if (child.getMasterId() === TEXT_ZYMBOL_NAME) {
            const text = child as TextZymbol;
            if (
              text.getCharacters().length === 0 ||
              (newRelativeCursor.length > 0 && newRelativeCursor[0] === 0)
            ) {
              newRelativeCursor = [];
            }
          }

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

  persistData = (): ZocketPersist => {
    return {
      [ZP_FIELDS.CHILDREN]: this.children.map((c) => c.persist()),
      [ZP_FIELDS.MODIFIERS]: [...this.modifiers],
    };
  };

  async hydrate(p: Partial<ZocketPersist>): Promise<void> {
    await safeHydrate(p, {
      [ZP_FIELDS.CHILDREN]: async (children) => {
        this.children = (await Promise.all(
          children.map((c) => hydrateChild(this, c))
        )) as Zymbol[];
      },
      [ZP_FIELDS.MODIFIERS]: (mod) => {
        this.modifiers = mod;
      },
    });

    this.reConnectParentChildren();
  }
}

const zocketCursorImpl = implementPartialCmdGroup(CursorCommand, {
  getInitialCursor: (): GetInitialCursorReturn => some([0]),
});

export const zocketHtmlIdImpl = implementPartialCmdGroup(
  ZymbolHtmlIdCommandGroup,
  {
    async getAllDescendentHTMLIds(zym) {
      if (zym.children.length === 0) {
        const pointer = zym.getFullCursorPointer();

        return [
          {
            loc: pointer,
            clickCursor: [...pointer, 0],
          },
        ];
      } else {
        return _.flatten(
          await Promise.all(
            zym.children.map(async (c) =>
              unwrap(
                await c.cmd<ZymbolHtmlClickInfo[]>(
                  ZymbolHtmlIdCommandGroup.getAllDescendentHTMLIds
                )
              )
            )
          ),
          1
        );
      }
    },
  }
);

zocketMaster.registerCmds([...zocketCursorImpl, ...zocketHtmlIdImpl]);
