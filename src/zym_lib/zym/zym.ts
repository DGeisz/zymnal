import { Cursor, CursorIndex, extendParentCursor } from "../zy_god/cursor";
import { KeyPressContext, ZymKeyPress } from "../zy_god/types/basic_types";
import { ZyId } from "../zy_types/basic_types";
import { KeyPressResponse } from "./zym_types";

export abstract class Zym<T, P = any> {
  private cursorIndex: CursorIndex;
  private parent?: Zym<any, any>;

  constructor(
    cursorIndex: CursorIndex,
    parent: Zym<any, any> | undefined,
    persisted?: P
  ) {
    this.cursorIndex = cursorIndex;
    this.parent = parent;

    if (persisted) {
      this.hydrate(persisted);
    }
  }

  getFullCursor = (): Cursor => {
    if (this.parent) {
      return extendParentCursor(this.cursorIndex, this.parent.getFullCursor());
    } else {
      return [this.cursorIndex];
    }
  };

  /* ===== MAIN RENDER METHODS ===== */

  /**
   * Paints the content associated with this zym
   * on the screen, not effecting any other zym
   * */
  abstract render(): void;

  /**
   * Gets information that the parent requires
   * to render itself
   * */
  abstract getRenderContent(): T;

  renderAndGetRenderContent(): T {
    this.render();
    return this.getRenderContent();
  }

  /* ===== PERSISTENCE METHODS ===== */

  /* ===== CURSOR METHODS / KEY HANDLERS ===== */

  abstract getInitialCursor(): Cursor;

  abstract handleKeyPress(
    keyPress: ZymKeyPress,
    ctx: KeyPressContext
  ): KeyPressResponse;

  /* Persists the zym */
  abstract persist(): P;

  /* Hydrates the zym from persisted data */
  abstract hydrate(persisted: P): void;

  abstract getZyMasterId(): ZyId;
}
