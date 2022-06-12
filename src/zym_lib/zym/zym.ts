import { ZyId } from "../zy_types/basic_types";

export abstract class Zym<T, P = any> {
  constructor(persisted?: P) {
    if (persisted) {
      this.hydrate(persisted);
    }
  }

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

  /* Persists the zym */
  abstract persist(): P;

  /* Hydrates the zym from persisted data */
  abstract hydrate(persisted: P): void;

  abstract getZyMasterId(): ZyId;
}
