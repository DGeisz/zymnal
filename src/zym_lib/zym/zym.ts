import { Cursor } from "../zy_god/cursor";
import { KeyPressContext, ZymKeyPress } from "../zy_god/types/basic_types";
import { ZyId } from "../zy_types/basic_types";
import { KeyPressResponse } from "./zym_types";

export abstract class Zym<T, P = any> {
  constructor(persisted?: P) {
    if (persisted) {
      this.hydrate(persisted);
    }
  }

  abstract getZyMasterId(): ZyId;

  /* ===== CURSOR METHODS / KEY HANDLERS ===== */

  abstract getInitialCursor(): Cursor;

  abstract handleKeyPress(
    keyPress: ZymKeyPress,
    ctx: KeyPressContext
  ): KeyPressResponse;

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

  /* Persists the zym */
  abstract persist(): P;

  /* Hydrates the zym from persisted data */
  abstract hydrate(persisted: P): void;
}
