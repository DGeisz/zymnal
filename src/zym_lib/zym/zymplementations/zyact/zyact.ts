import React from "react";
import { Zym } from "../../zym";
import { withZyactComponent } from "./hoc";

export abstract class Zyact<
  Persist = any,
  Props extends object = {}
> extends Zym<React.FC<Props>, Persist> {
  rerender: () => void = () => {};

  abstract component: React.FC<Props>;

  render(): void {
    this.rerender();
  }

  getRenderContent = (): React.FC<Props> => {
    return withZyactComponent(this, this.component);
  };

  setRerender(rerender: () => void) {
    this.rerender = rerender;
  }
}
