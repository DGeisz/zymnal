import _ from "underscore";
import {
  add_color_box,
  cursorToString,
  CURSOR_LATEX,
  INLINE_CURSOR_LATEX,
  LATEX_EMPTY_SOCKET,
  LATEX_SPACE,
  wrapHtmlId,
} from "../../../../../global_utils/latex_utils";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../../zym_lib/zym/zym";
import { ZyMaster } from "../../../../../zym_lib/zym/zy_master";
import { zySome } from "../../../../../zym_lib/utils/zy_option";
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
  KeyPressBasicType,
  KeyPressModifier,
  ZymbolDirection,
  ZymKeyPress,
} from "../../../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../../../zym_lib/utils/basic_context";
import { addZymChangeLink } from "../../../../../zym_lib/zy_god/undo_redo/undo_redo";
import {
  DUMMY_FRAME,
  ZymbolFrame,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import {
  DeleteBehavior,
  DeleteBehaviorType,
  deleteBehaviorNormal,
} from "../../delete_behavior";
import {
  keyPressHasModifier,
  SpliceDeleteResponse,
  Zymbol,
  ZymbolHtmlIdTrait,
  ZymbolRenderArgs,
} from "../../zymbol";
import { extendZymbol } from "../../zymbol_cmd";
import { TextZymbol } from "../text_zymbol/text_zymbol";
import {
  CursorCommandTrait,
  VerticalNavigationHandleType,
} from "../../../../../zym_lib/zy_god/cursor/cursor_commands";
import { unwrapTraitResponse } from "../../../../../zym_lib/zy_trait/zy_trait";
import {
  ZocketSchema,
  ZOCKET_MASTER_ID,
  ZymbolModifier,
} from "./zocket_schema";
import {
  ZyPartialPersist,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import {
  isTextZymbol,
  TEXT_ZYMBOL_NAME,
} from "../text_zymbol/text_zymbol_schema";
import {
  isZymbolFrame,
  ZYMBOL_FRAME_MASTER_ID,
} from "../../../zymbol_infrastructure/zymbol_frame/zymbol_frame_schema";
import { palette } from "../../../../../global_styles/palette";
import { zyMath } from "../../../../../global_building_blocks/tex/autoRender";
import { ZyGodMethod } from "../../../../../zym_lib/zy_god/zy_god_schema";
import {
  ModuleLineType,
  ZymbolModuleMethod,
} from "../../../zymbol_infrastructure/zymbol_module/zymbol_module_schema";
import { last } from "../../../../../global_utils/array_utils";
import { USING_VSCODE } from "../../../../../global_utils/vs_code_utils";

const GROUP_COLOR = USING_VSCODE ? palette.beneathTheWaves : palette.oceanFroth;

/* === Helper Types === */

class ZocketMaster extends ZyMaster<ZocketSchema> {
  zyId = ZOCKET_MASTER_ID;

  newBlankChild(): Zym<any, any, any> {
    return new Zocket(DUMMY_FRAME, 0, undefined);
  }
}

export const zocketMaster = new ZocketMaster();

/* Extensions */
extendZymbol(zocketMaster);

export class Zocket extends Zymbol<ZocketSchema> {
  zyMaster = zocketMaster;
  children: Zymbol<any, any>[] = [];
  modifiers: ZymbolModifier[] = [];
  inline: boolean;

  constructor(
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined,
    inline?: boolean
  ) {
    super(parentFrame, cursorIndex, parent);

    this.inline = !!inline;

    this.setPersistenceSchemaSymbols({
      children: "c",
      modifiers: "m",
      inline: "i",
    });
  }

  /* USED ONLY FOR TESTS */
  getZymbols = () => this.children;
  setZymbols = (zymbols: Zymbol<any, any>[]) => (this.children = zymbols);

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
      if (
        keyPressHasModifier(ctx, KeyPressModifier.Option) ||
        keyPressHasModifier(ctx, KeyPressModifier.Shift)
      ) {
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
        // Handle special interaction for inline text
        if (this.inline) {
          if (this.children[nextCursorIndex - 1]) {
            const { success, newRelativeCursor } =
              this.children[nextCursorIndex - 1].takeCursorFromRight(ctx);

            if (success) {
              return successfulMoveResponse([
                nextCursorIndex - 1,
                ...newRelativeCursor,
              ]);
            }
          } else if (isTextZymbol(this.children[nextCursorIndex])) {
            return FAILED_CURSOR_MOVE_RESPONSE;
          }
        }

        return successfulMoveResponse([nextCursorIndex]);
      }
    }
  };

  takeCursorFromLeft = (_ctx: BasicContext) => {
    if (this.inline && this.children[0] && isTextZymbol(this.children[0])) {
      const { success, newRelativeCursor } =
        this.children[0].takeCursorFromLeft();

      if (success) {
        return successfulMoveResponse([0, ...newRelativeCursor]);
      }
    }

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
      (keyPressHasModifier(ctx, KeyPressModifier.Option) ||
        keyPressHasModifier(ctx, KeyPressModifier.Shift))
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
      if (this.inline) {
        if (this.children[nextCursorIndex + 1]) {
          const { success, newRelativeCursor } =
            this.children[nextCursorIndex + 1].takeCursorFromLeft(ctx);

          if (success) {
            return successfulMoveResponse([
              nextCursorIndex + 1,
              ...newRelativeCursor,
            ]);
          }
        } else if (isTextZymbol(this.children[nextCursorIndex])) {
          return FAILED_CURSOR_MOVE_RESPONSE;
        }
      }
      return {
        success: true,
        newRelativeCursor: [nextCursorIndex + 1],
      };
    }
  };

  takeCursorFromRight = (ctx: BasicContext) => {
    if (
      this.inline &&
      this.children.length > 0 &&
      isTextZymbol(last(this.children))
    ) {
      const { success, newRelativeCursor } = last(
        this.children
      ).takeCursorFromRight(ctx);

      if (success) {
        return successfulMoveResponse([
          this.children.length - 1,
          ...newRelativeCursor,
        ]);
      }
    }

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
      if (this.inline) {
        const { success, newRelativeCursor } = this.children[
          nextCursorIndex
        ]?.moveCursorUp(childRelativeCursor, ctx);

        if (success) {
          return successfulMoveResponse([
            nextCursorIndex,
            ...newRelativeCursor,
          ]);
        } else {
          const prevChild = this.children[nextCursorIndex - 1];

          if (prevChild && isTextZymbol(prevChild)) {
            const { success, newRelativeCursor } =
              prevChild.takeCursorFromRight();

            if (success) {
              return successfulMoveResponse([
                nextCursorIndex - 1,
                ...newRelativeCursor,
              ]);
            }
          }

          return FAILED_CURSOR_MOVE_RESPONSE;
        }
      }

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
      if (this.inline) {
        const { success, newRelativeCursor } = this.children[
          nextCursorIndex
        ]?.moveCursorDown(childRelativeCursor, ctx);

        if (success) {
          return successfulMoveResponse([
            nextCursorIndex,
            ...newRelativeCursor,
          ]);
        } else {
          const nextChild = this.children[nextCursorIndex + 1];

          if (nextChild && isTextZymbol(nextChild)) {
            const { success, newRelativeCursor } =
              nextChild.takeCursorFromLeft();

            if (success) {
              return successfulMoveResponse([
                nextCursorIndex + 1,
                ...newRelativeCursor,
              ]);
            }
          }

          return FAILED_CURSOR_MOVE_RESPONSE;
        }
      }

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

  /* Figure out how we're handling undo-redo */
  _addZymChangeLinks = (
    ctx: BasicContext,
    beforeChildren: ZymPersist<any, any>[],
    afterChildren: ZymPersist<any, any>[]
  ) => {
    addZymChangeLink<ZocketSchema>(ctx, {
      zymLocation: this.getFullCursorPointer(),
      beforeChange: {
        renderOpts: { cursor: [] },
        zymState: {
          children: beforeChildren,
        },
      },
      afterChange: {
        renderOpts: { cursor: [] },
        zymState: {
          children: afterChildren,
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

      // Handle inline edge case (put the cursor on the text zymbol)
      if (this.inline && mergedRes.success) {
        const { newRelativeCursor } = mergedRes;

        if (newRelativeCursor.length === 1 && newRelativeCursor[0] > 0) {
          const index = newRelativeCursor[0] - 1;

          if (isTextZymbol(this.children[index])) {
            const { success, newRelativeCursor } =
              this.children[index].takeCursorFromRight(ctx);

            if (success) {
              return successfulMoveResponse([index, ...newRelativeCursor]);
            }
          }
        }
      }

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

  defaultKeyPressHandler = (
    keyPress: ZymKeyPress,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse => {
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    const child = this.children[nextCursorIndex];

    if (keyPress.type === KeyPressBasicType.Enter) {
      if (
        this.parent &&
        isZymbolFrame(this.parent) &&
        nextCursorIndex > -1 &&
        (childRelativeCursor.length === 0 || (child && isTextZymbol(child)))
      ) {
        if (this.inline) {
          if (nextCursorIndex === 0 && childRelativeCursor.length === 0) {
            this.callZentinelMethod(
              ZyGodMethod.queueKeyPressCallback,
              async () => {
                await this.callZentinelMethod(
                  ZymbolModuleMethod.addInlineBuffer,
                  {
                    cursor: [...this.getFullCursorPointer(), ...cursor],
                  }
                );
              }
            );
          } else {
            this.callZentinelMethod(
              ZyGodMethod.queueKeyPressCallback,
              async () => {
                await this.callZentinelMethod(ZymbolModuleMethod.breakLine, {
                  cursor: [...this.getFullCursorPointer(), ...cursor],
                });
              }
            );
          }
        } else {
          if (nextCursorIndex === 0 && childRelativeCursor.length === 0) {
            this.callZentinelMethod(
              ZyGodMethod.queueKeyPressCallback,
              async () => {
                await this.callZentinelMethod(ZymbolModuleMethod.addLine, {
                  cursor: [...this.getFullCursorPointer(), ...cursor],
                  lineType: ModuleLineType.Inline,
                });
              }
            );
          }
        }

        return FAILED_CURSOR_MOVE_RESPONSE;
      } else if (
        cursor.length === 0 ||
        nextCursorIndex <= -1 ||
        nextCursorIndex >= this.children.length
      ) {
        this.callZentinelMethod(ZyGodMethod.queueSimulatedKeyPress, {
          type: KeyPressBasicType.ArrowRight,
        });

        return FAILED_CURSOR_MOVE_RESPONSE;
      }
    }
    if (!this.children[nextCursorIndex]) {
      console.error("master", this.getMasterId(), this.__fullCursorIdPointer());
    }

    return wrapChildCursorResponse(
      this.children[nextCursorIndex].defaultKeyPressHandler(
        keyPress,
        childRelativeCursor,
        ctx
      ),
      nextCursorIndex
    );
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

  renderTex = (opts: ZymbolRenderArgs) => {
    const inline = this.parentFrame.inlineTex;

    const { cursor, excludeHtmlIds } = opts;

    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    const cursorTex = this.inline ? INLINE_CURSOR_LATEX : CURSOR_LATEX;

    let finalTex = "";
    let emptySocket = false;

    if (!this.inline && this.children.length === 0 && !parentOfCursorElement) {
      finalTex = LATEX_EMPTY_SOCKET;
      emptySocket = true;
    } else {
      for (let i = 0; i < this.children.length; i++) {
        if (parentOfCursorElement) {
          if (i === nextCursorIndex) {
            finalTex += cursorTex;

            if (
              !this.inline &&
              this.children[i].getMasterId() === ZOCKET_MASTER_ID
            ) {
              finalTex += LATEX_SPACE;
            }
          }
          let childTex = this.children[i].renderTex({ ...opts, cursor: [] });

          if (this.inline && !isTextZymbol(this.children[i])) {
            finalTex += zyMath(childTex);
          } else {
            finalTex += childTex + " ";
          }
        } else {
          let childTex = this.children[i].renderTex({
            ...opts,
            cursor: i === nextCursorIndex ? childRelativeCursor : [],
          });

          if (this.inline && !isTextZymbol(this.children[i])) {
            finalTex += zyMath(childTex);
          } else {
            finalTex += childTex + " ";
          }
        }
      }
    }

    if (parentOfCursorElement && nextCursorIndex === this.children.length) {
      if (this.inline) {
        finalTex = finalTex.trimEnd();
      }
      finalTex += cursorTex;
    }

    /* Now wrap this in all the modifiers */
    if (!this.inline) {
      for (const mod of this.modifiers) {
        finalTex = `${mod.pre}${finalTex}${mod.post}`;
      }
    }

    const colorBoxTex = add_color_box(finalTex, GROUP_COLOR, opts.inlineTex);

    if (
      this.parent?.getMasterId() === ZOCKET_MASTER_ID &&
      this.modifiers.length === 0
    ) {
      if (inline) {
        if (this.parent?.parent?.getMasterId() === ZYMBOL_FRAME_MASTER_ID) {
          if (nextCursorIndex > -1) {
            finalTex = colorBoxTex;
          }
        } else {
          finalTex = colorBoxTex;
        }
      } else {
        finalTex = colorBoxTex;
      }
    }

    if (!excludeHtmlIds && emptySocket) {
      finalTex = wrapHtmlId(
        finalTex,
        cursorToString(this.getFullCursorPointer())
      );
    }

    return finalTex;
  };

  getDeleteBehavior = (): DeleteBehavior => {
    if (
      this.parentFrame.inlineTex &&
      this.parent &&
      isZymbolFrame(this.parent!.parent!)
    ) {
      return deleteBehaviorNormal(DeleteBehaviorType.ABSORB);
    } else {
      return deleteBehaviorNormal(DeleteBehaviorType.SPLICE);
    }
  };

  spliceDelete = (
    _cursor: Cursor,
    _ctx: BasicContext
  ): SpliceDeleteResponse | undefined => ({
    zymbols: [...this.children],
    putCursorAtEnd: true,
  });

  letParentDeleteWithDeleteBehavior = (
    cursor: Cursor,
    _ctx: BasicContext
  ): DeleteBehavior | undefined => {
    const { nextCursorIndex, parentOfCursorElement } =
      extractCursorInfo(cursor);

    if (parentOfCursorElement && nextCursorIndex === 0) {
      if (this.children.length === 0) {
        return deleteBehaviorNormal(DeleteBehaviorType.ALLOWED);
      } else {
        return deleteBehaviorNormal(DeleteBehaviorType.MOVE_LEFT);
      }
    }
  };

  isBaseZocket = () => !!(this.parent && isZymbolFrame(this.parent));

  delete = (cursor: Cursor, ctx: BasicContext): CursorMoveResponse => {
    const { parentOfCursorElement, nextCursorIndex, childRelativeCursor } =
      extractCursorInfo(cursor);

    /* First we want to deal with line-based behavior */
    if (
      this.isBaseZocket() &&
      nextCursorIndex === 0 &&
      childRelativeCursor.length === 0
    ) {
      this.callZentinelMethod(ZyGodMethod.queueKeyPressCallback, async () => {
        this.callZentinelMethod(ZymbolModuleMethod.handleLineFrontDelete, {
          cursor: [...this.getFullCursorPointer(), ...cursor],
        });
      });

      return FAILED_CURSOR_MOVE_RESPONSE;
    }

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
      deleteBehavior = keyPressHasModifier(ctx, KeyPressModifier.Shift)
        ? deleteBehaviorNormal(DeleteBehaviorType.ALLOWED)
        : zymbol.getDeleteBehavior();
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

  persistData = () => {
    return {
      children: this.children.map((c) => c.persist()),
      modifiers: [...this.modifiers],
      inline: this.inline,
    };
  };

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<ZocketSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      children: async (children) => {
        this.children = (await Promise.all(
          children.map((c) => hydrateChild(this, c))
        )) as Zymbol[];
      },
      modifiers: (mod) => {
        this.modifiers = mod;
      },
      inline: (i) => {
        this.inline = i;
      },
    });
  }

  getRefreshedChildrenPointer(): Zym[] {
    return this.children;
  }
}

zocketMaster.implementTrait(CursorCommandTrait, {
  getInitialCursor: async (zym) => {
    const zocket = zym as Zocket;

    if (
      zocket.inline &&
      zocket.children.length > 0 &&
      isTextZymbol(zocket.children[0])
    ) {
      return zySome([0, 0]);
    }

    return zySome([0]);
  },
  getEndCursor: async (zym) => {
    const zocket = zym as Zocket;

    if (
      zocket.inline &&
      zocket.children.length > 0 &&
      isTextZymbol(last(zocket.children))
    ) {
      return zySome([
        zocket.children.length - 1,
        (last(zocket.children) as TextZymbol).getCharacters().length,
      ]);
    }

    return zySome([zocket.children.length]);
  },
  checkVerticalNavigationType: async (zym, cursor) => {
    const zocket = zym as Zocket;

    if (!zocket.inline) return VerticalNavigationHandleType.ZyManaged;

    const { nextCursorIndex, childRelativeCursor, parentOfCursorElement } =
      extractCursorInfo(cursor);
    const child = zym.children[nextCursorIndex];

    if (parentOfCursorElement) return VerticalNavigationHandleType.ZyManaged;

    if (child) {
      return unwrapTraitResponse(
        await child.callTraitMethod(
          CursorCommandTrait.checkVerticalNavigationType,
          childRelativeCursor
        )
      );
    }

    return VerticalNavigationHandleType.DomManaged;
  },
});

zocketMaster.implementTrait(ZymbolHtmlIdTrait, {
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
            unwrapTraitResponse(
              await c.callTraitMethod(
                ZymbolHtmlIdTrait.getAllDescendentHTMLIds,
                undefined
              )
            )
          )
        ),
        1
      );
    }
  },
});
