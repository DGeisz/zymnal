import { CursorIndex } from "../../../lib/cursor";
import { Zym } from "../../../zym_lib/zym/zym";
import {
  Cursor,
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

export interface ZymbolRenderArgs {
  cursor: Cursor;
}

export abstract class Zymbol<P = any> extends Zym<TeX, P> {
  parentFrame: ZymbolFrame;

  constructor(
    parentFrame: ZymbolFrame,
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined,
    persisted?: P
  ) {
    super(cursorIndex, parent, persisted);
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
    switch (keyPress.type) {
      case KeyPressBasicType.ArrowDown:
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
  abstract takeCursorFromLeft: () => CursorMoveResponse;

  abstract moveCursorRight: (
    cursor: Cursor,
    ctx: BasicContext
  ) => CursorMoveResponse;
  abstract takeCursorFromRight: () => CursorMoveResponse;

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
}
