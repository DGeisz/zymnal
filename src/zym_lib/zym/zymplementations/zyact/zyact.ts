import { Zym } from "../../zym";

export abstract class Zyact<Props = any, Persist = any> extends Zym<
  React.FC<Props>,
  Persist
> {
  render(): void {
    this.rerender();
  }

  rerender: () => void = () => {};

  setRerender(rerender: () => void) {
    this.rerender = rerender;
  }
}
