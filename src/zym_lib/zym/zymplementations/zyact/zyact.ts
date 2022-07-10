import React from "react";
import { Zym } from "../../zym";
import { withZyactComponent } from "./hoc";

export abstract class Zyact<
  Persist = any,
  Props extends object = {}
> extends Zym<React.FC<Props>, Persist, Props> {
  rerender: (opts?: Props) => void = () => {};

  abstract component: React.FC<Props & Props>;

  render(opts?: Props): void {
    this.rerender(opts);
  }

  getRenderContent = (): React.FC<Props> => {
    return withZyactComponent(this, this.component);
  };

  setRerender(rerender: (opts?: Props) => void) {
    this.rerender = rerender;
  }
}
