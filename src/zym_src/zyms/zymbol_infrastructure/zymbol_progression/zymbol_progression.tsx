import { FC } from "react";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZYMBOL_PROGRESSION_ID } from "./zp_master";
import { ZymbolProgressionPersist } from "./zp_persist";

export class ZymbolProgression extends Zyact<ZymbolProgressionPersist> {
  component: FC<any> = () => <div>What's up?</div>;

  persist() {
    return {};
  }

  hydrate(persisted: any): void {
    /* TODO: Fill this in! */
  }

  getZyMasterId(): string {
    return ZYMBOL_PROGRESSION_ID;
  }
}
