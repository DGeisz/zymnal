import _ from "underscore";
import { last } from "../../../global_utils/array_utils";
import { Zym } from "../../../zym_lib/zym/zym";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
  wrapChildCursorResponse,
} from "../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressModifier,
  ZymbolDirection,
  ZymKeyPress,
} from "../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../zym_lib/utils/basic_context";
import { ZymbolFrame } from "../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { DeleteBehavior } from "./delete_behavior";
import { TeX } from "./zymbol_types";
import { ZyGodMethod } from "../../../zym_lib/zy_god/zy_god_schema";
import {
  createZyTrait,
  CreateZyTraitSchema,
  TraitImplementation,
  unwrapTraitResponse,
} from "../../../zym_lib/zy_trait/zy_trait";
import { defaultTraitImplementation } from "../../../zym_lib/zy_trait/default_trait_zentinel/default_trait_zentinel_schema";
import { zyGod } from "../../../zym_lib/zy_god/zy_god";
import {
  ZyPersistenceSchema,
  ZySchema,
} from "../../../zym_lib/zy_schema/zy_schema";

/* Help */
export interface ZymbolRenderArgs {
  cursor: Cursor;
  inlineTex: boolean;
  excludeHtmlIds?: boolean;
  copyTex?: boolean;
}

export const KEYPRESS_ZYMBOL = "keypress";

export function getKeyPress(ctx: BasicContext): ZymKeyPress {
  return ctx.get(KEYPRESS_ZYMBOL);
}

export function keyPressHasModifier(
  ctx: BasicContext,
  mod: KeyPressModifier
): boolean {
  const { modifiers } = getKeyPress(ctx);

  return !!modifiers && modifiers.includes(mod);
}

export const ENTER_USED_TO_CONFIRM_TRANSFORM = "enter-used";

export function enterUsedToConfirmTransform(ctx: BasicContext): boolean {
  return !!ctx.get(ENTER_USED_TO_CONFIRM_TRANSFORM);
}

export function setEnterUsedToConfirmTransform(
  ctx: BasicContext,
  used: boolean
) {
  ctx.set(ENTER_USED_TO_CONFIRM_TRANSFORM, used);
}

export interface SpliceDeleteResponse {
  zymbols: Zymbol<any, any>[];
  putCursorAtEnd: boolean;
}

export abstract class Zymbol<
  Schema extends ZySchema = any,
  PersistenceSchema extends ZyPersistenceSchema<Schema> = any
> extends Zym<Schema, PersistenceSchema, TeX> {
  parentFrame: ZymbolFrame;
  abstract children: Zymbol<any, any>[];

  constructor(
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined
  ) {
    super(cursorIndex, parent);
    this.parentFrame = parentFrame;
  }

  render = () => {
    this.parentFrame.render();
  };

  /* Override this if you want any special cleanup methods applied after a keypress */
  onHandleKeyPress = (
    res: CursorMoveResponse,
    _keyPress: ZymKeyPress
  ): CursorMoveResponse => {
    return res;
  };

  handleKeyPress = (
    keyPress: ZymKeyPress,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse => {
    ctx.set(KEYPRESS_ZYMBOL, keyPress);
    this.reIndexChildren();

    let res: CursorMoveResponse;
    switch (keyPress.type) {
      case KeyPressBasicType.ArrowLeft:
        res = this.moveCursorLeft(cursor, ctx);
        break;
      case KeyPressBasicType.ArrowRight:
        res = this.moveCursorRight(cursor, ctx);
        break;
      case KeyPressBasicType.ArrowUp:
        res = this.moveCursorUp(cursor, ctx);
        break;
      case KeyPressBasicType.ArrowDown:
        res = this.moveCursorDown(cursor, ctx);
        break;
      case KeyPressBasicType.Delete:
        res = this.delete(cursor, ctx);
        break;
      case KeyPressComplexType.Key: {
        res = this.addCharacter(keyPress.key, cursor, ctx);
        break;
      }
      default: {
        res = this.defaultKeyPressHandler(keyPress, cursor, ctx);
        break;
      }
    }

    return this.onHandleKeyPress(res, keyPress);
  };

  defaultKeyPressHandler = (
    keyPress: ZymKeyPress,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse => {
    const { childRelativeCursor, nextCursorIndex } = extractCursorInfo(cursor);

    if (
      keyPress.type === KeyPressBasicType.Enter &&
      (cursor.length === 0 ||
        nextCursorIndex <= -1 ||
        nextCursorIndex >= this.children.length)
    ) {
      this.callZentinelMethod(ZyGodMethod.queueSimulatedKeyPress, {
        type: KeyPressBasicType.ArrowRight,
      });

      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return wrapChildCursorResponse(
        this.children[nextCursorIndex].defaultKeyPressHandler(
          keyPress,
          childRelativeCursor,
          ctx
        ),
        nextCursorIndex
      );
    }
  };

  abstract moveCursorLeft(
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse;
  abstract takeCursorFromLeft(ctx: BasicContext): CursorMoveResponse;

  abstract moveCursorRight(
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse;
  abstract takeCursorFromRight(ctx: BasicContext): CursorMoveResponse;

  absorbCursor = (ctx: BasicContext) => this.takeCursorFromRight(ctx);

  abstract moveCursorUp(cursor: Cursor, ctx: BasicContext): CursorMoveResponse;

  abstract captureArrowUp(
    fromSide: ZymbolDirection,
    ctx: BasicContext
  ): CursorMoveResponse;

  abstract moveCursorDown(
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse;

  abstract captureArrowDown(
    fromSide: ZymbolDirection,
    ctx: BasicContext
  ): CursorMoveResponse;

  abstract addCharacter(
    character: string,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse;

  abstract getDeleteBehavior(): DeleteBehavior;

  /* This needs to be overloaded for any more complex zymbol */
  abstract delete(cursor: Cursor, ctx: BasicContext): CursorMoveResponse;

  /* This needs to be overloaded if the zymbol allows deflect deletes.
  @return: Indicates whether the deflect delete was successful */
  deflectDelete = (_ctx: BasicContext): boolean => false;

  spliceDelete = (
    _cursor: Cursor,
    _ctx: BasicContext
  ): SpliceDeleteResponse | undefined => undefined;

  /** 
  If this returns something defined, it indicates
  we want to delete the zymbol using the given delete behavior 
  */
  letParentDeleteWithDeleteBehavior = (
    _cursor: Cursor,
    _ctx: BasicContext
  ): DeleteBehavior | undefined => undefined;

  abstract renderTex(opts: ZymbolRenderArgs): TeX;

  getRenderContent = (opts: ZymbolRenderArgs) => this.renderTex(opts);

  setParentFrame = (frame: ZymbolFrame) => {
    this.parentFrame = frame;
    this.children.forEach((c) => (c as Zymbol<any, any>).setParentFrame(frame));
  };
}

export const ZYMBOL_HTML_ID_COMMANDS = "zymbol-html-id-com";

export interface ZymbolHtmlClickInfo {
  loc: Cursor;
  /* Where the cursor should go after it's clicked */
  clickCursor: Cursor;
  isSelectableText?: boolean;
  selectableOffset?: number;
}

export type ZymbolHtmlIdSchema = CreateZyTraitSchema<{
  getAllDescendentHTMLIds: {
    args: undefined;
    return: ZymbolHtmlClickInfo[];
  };
}>;

export const ZymbolHtmlIdTrait = createZyTrait<ZymbolHtmlIdSchema>(
  ZYMBOL_HTML_ID_COMMANDS,
  {
    getAllDescendentHTMLIds: "gadh",
  }
);

defaultTraitImplementation(ZymbolHtmlIdTrait, zyGod, {
  async getAllDescendentHTMLIds(zym) {
    return _.flatten(
      await Promise.all(
        zym.children.map(async (c: Zym<any, any, any>) =>
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
  },
});

export const basicZymbolHtmlIdImplementation: TraitImplementation<ZymbolHtmlIdSchema> =
  {
    async getAllDescendentHTMLIds(zym) {
      const pointer = zym.getFullCursorPointer();

      const nextPointer = [...pointer];
      nextPointer.splice(nextPointer.length - 1, 1, last(nextPointer) + 1);

      return [
        {
          loc: pointer,
          clickCursor: nextPointer,
          isSelectableText: false,
        },
      ];
    },
  };
