import { CursorIndex } from "../../../lib/cursor";
import { Zym } from "../../../zym_lib/zym/zym";
import { ZymbolFrame } from "../zymbol_infrastructure/zymbol_frame/zymbol_frame";
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
}
