import React from "react";
import {
  ZyBaseSchema,
  ZyPersistenceSchema,
  ZySchema,
} from "../../../zy_schema/zy_schema";
import { Zym } from "../../zym";
import { withZyactComponent } from "./hoc";

export abstract class Zyact<
  Schema extends ZySchema<BSchema, PSchema> = any,
  Props extends object = {},
  BSchema extends ZyBaseSchema = Schema["base"],
  PSchema extends ZyPersistenceSchema<BSchema> = Schema["persistence"]
> extends Zym<Schema, React.FC<Props>, Props> {
  private renderCount = 0;

  getRenderCount = () => this.renderCount;

  rerender: (opts?: Props) => void = () => {};

  /* Most zyacts don't actually use props, so this is needless for almost all cases */
  // @ts-ignore
  getInitialProps: () => Props = () => {};

  abstract component: React.FC<Props>;

  render(opts?: Props): void {
    this.renderCount++;

    this.rerender(opts);
  }

  getRenderContent = (): React.FC<Props> => {
    return withZyactComponent(this, this.component, this.getInitialProps());
  };

  setRerender(rerender: (opts?: Props) => void) {
    this.rerender = rerender;
  }
}
