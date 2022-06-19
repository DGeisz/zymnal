import { CursorIndex } from "../../../lib/cursor";
import { Zym } from "../../../zym_lib/zym/zym";
import {
  FAILED_KEY_PRESS_RESPONSE,
  KeyPressResponse,
} from "../../../zym_lib/zym/zym_types";
import {
  KeyPressBasicType,
  KeyPressComplexType,
  KeyPressContext,
  ZymKeyPress,
} from "../../../zym_lib/zy_god/types/basic_types";
import { ZymbolFrame } from "../zymbol_infrastructure/zymbol_frame/zymbol_frame";
import { DeleteBehavior } from "./delete_behavior";
import { TeX } from "./zymbol_types";

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
    ctx: KeyPressContext
  ): KeyPressResponse => {
    switch (keyPress.type) {
      case KeyPressBasicType.ArrowDown:
        return this.moveCursorLeft(ctx);
      case KeyPressBasicType.ArrowRight:
        return this.moveCursorRight(ctx);
      case KeyPressBasicType.Delete:
        return this.delete(ctx);
      case KeyPressComplexType.Key: {
        return this.addCharacter(keyPress.key, ctx);
      }
      default:
        return FAILED_KEY_PRESS_RESPONSE;
    }
  };

  abstract moveCursorLeft: (ctx: KeyPressContext) => KeyPressResponse;
  abstract takeCursorFromLeft: () => KeyPressResponse;

  abstract moveCursorRight: (ctx: KeyPressContext) => KeyPressResponse;
  abstract takeCursorFromRight: () => KeyPressResponse;

  abstract addCharacter: (
    character: string,
    ctx: KeyPressContext
  ) => KeyPressResponse;

  abstract getDeleteBehavior: () => DeleteBehavior;

  primeDelete = () => {};

  /* This needs to be overloaded for any more complex zymbol */
  delete = (_ctx: KeyPressContext) => FAILED_KEY_PRESS_RESPONSE;

  /* This needs to be overloaded if the zymbol allows deflect deletes.
  @return: Indicates whether the deflect delete was successful */
  deflectDelete = (): boolean => false;

  abstract renderTex: () => TeX;

  getRenderContent = () => this.renderTex();
}
