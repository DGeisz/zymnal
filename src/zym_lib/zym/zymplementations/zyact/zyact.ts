import React from "react";
import { Zym } from "../../zym";
import { withZyactComponent } from "./hoc";

export abstract class Zyact<
  Props extends object = any,
  Persist = any
> extends Zym<React.FC<Props>, Persist> {
  rerender: () => void = () => {};

  abstract component: React.FC<Props>;

  render(): void {
    this.rerender();
  }

  getRenderContent(): React.FC<any> {
    return withZyactComponent(this, this.component);
  }

  setRerender(rerender: () => void) {
    this.rerender = rerender;
  }
}
