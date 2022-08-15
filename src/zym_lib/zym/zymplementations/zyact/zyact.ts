import React from "react";
import { ZyPersistenceSchema, ZySchema } from "../../../zy_schema/zy_schema";
import { Zym } from "../../zym";
import { withZyactComponent } from "./hoc";

export abstract class Zyact<
  Schema extends ZySchema,
  PersistenceSchema extends ZyPersistenceSchema<Schema>,
  Props extends object = {}
> extends Zym<Schema, PersistenceSchema, React.FC<Props>, Props> {
  private renderCount = 0;

  getRenderCount = () => this.renderCount;

  rerender: (opts?: Props) => void = () => {};

  abstract component: React.FC<Props & Props>;

  render(opts?: Props): void {
    this.renderCount++;

    this.rerender(opts);
  }

  getRenderContent = (): React.FC<Props> => {
    return withZyactComponent(this, this.component);
  };

  setRerender(rerender: (opts?: Props) => void) {
    this.rerender = rerender;
  }
}
