import { Zym } from "../../../zym_lib/zym/zym";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  extractCursorInfo,
  FAILED_CURSOR_MOVE_RESPONSE,
} from "../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressModifier,
  ZymKeyPress,
} from "../../../zym_lib/zy_god/event_handler/key_press";
import { BasicContext } from "../../../zym_lib/zy_god/types/context_types";
import { ZymbolFrame } from "../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { DeleteBehavior } from "./delete_behavior";
import { TeX } from "./zymbol_types";

/* Help */
export interface ZymbolRenderArgs {
  cursor: Cursor;
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

export abstract class Zymbol<P = any> extends Zym<TeX, P> {
  parentFrame: ZymbolFrame;
  abstract children: Zymbol[];

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
      cursor.length === 0 ||
      nextCursorIndex <= -1 ||
      nextCursorIndex >= this.children.length
    ) {
      return FAILED_CURSOR_MOVE_RESPONSE;
    } else {
      return this.children[nextCursorIndex].defaultKeyPressHandler(
        keyPress,
        childRelativeCursor,
        ctx
      );
    }
  };

  abstract moveCursorLeft: (
    cursor: Cursor,
    ctx: BasicContext
  ) => CursorMoveResponse;
  abstract takeCursorFromLeft: (ctx: BasicContext) => CursorMoveResponse;

  abstract moveCursorRight: (
    cursor: Cursor,
    ctx: BasicContext
  ) => CursorMoveResponse;
  abstract takeCursorFromRight: (ctx: BasicContext) => CursorMoveResponse;

  abstract addCharacter: (
    character: string,
    cursor: Cursor,
    ctx: BasicContext
  ) => CursorMoveResponse;

  abstract getDeleteBehavior: () => DeleteBehavior;

  primeDelete = () => {};

  /* This needs to be overloaded for any more complex zymbol */
  abstract delete(cursor: Cursor, ctx: BasicContext): CursorMoveResponse;

  /* This needs to be overloaded if the zymbol allows deflect deletes.
  @return: Indicates whether the deflect delete was successful */
  deflectDelete = (ctx: BasicContext): boolean => false;

  abstract renderTex: (opts: ZymbolRenderArgs) => TeX;

  getRenderContent = (opts: ZymbolRenderArgs) => this.renderTex(opts);

  setParentFrame = (frame: ZymbolFrame) => {
    this.parentFrame = frame;
    this.children.forEach((c) => (c as Zymbol).setParentFrame(frame));
  };
}
