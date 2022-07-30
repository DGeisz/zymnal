import { Zym } from "../../../zym_lib/zym/zym";
import {
  Cursor,
  CursorIndex,
  CursorMoveResponse,
  FAILED_CURSOR_MOVE_RESPONSE,
} from "../../../zym_lib/zy_god/cursor/cursor";
import {
  KeyPressBasicType,
  KeyPressComplexType,
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

export abstract class Zymbol<P = any> extends Zym<TeX, P> {
  parentFrame: ZymbolFrame;

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

  handleKeyPress = (
    keyPress: ZymKeyPress,
    cursor: Cursor,
    ctx: BasicContext
  ): CursorMoveResponse => {
    ctx.set(KEYPRESS_ZYMBOL, keyPress);

    switch (keyPress.type) {
      case KeyPressBasicType.ArrowLeft:
        return this.moveCursorLeft(cursor, ctx);
      case KeyPressBasicType.ArrowRight:
        return this.moveCursorRight(cursor, ctx);
      case KeyPressBasicType.Delete:
        return this.delete(cursor, ctx);
      case KeyPressComplexType.Key: {
        return this.addCharacter(keyPress.key, cursor, ctx);
      }
      default:
        return FAILED_CURSOR_MOVE_RESPONSE;
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
  delete = (_cursor: Cursor, _ctx: BasicContext) => FAILED_CURSOR_MOVE_RESPONSE;

  /* This needs to be overloaded if the zymbol allows deflect deletes.
  @return: Indicates whether the deflect delete was successful */
  deflectDelete = (): boolean => false;

  abstract renderTex: (opts: ZymbolRenderArgs) => TeX;

  getRenderContent = (opts: ZymbolRenderArgs) => this.renderTex(opts);

  setParentFrame = (frame: ZymbolFrame) => {
    this.parentFrame = frame;
    this.children.forEach((c) => (c as Zymbol).setParentFrame(frame));
  };
}
