import { FC } from "react";
import { Zym } from "../../../../zym_lib/zym/zym";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { ZymbolFrame } from "../zymbol_frame/zymbol_frame";
import { zymbolProgressionMaster } from "./zp_master";
import { ZymbolProgressionPersist } from "./zp_persist";

export class ZymbolProgression extends Zyact<ZymbolProgressionPersist> {
  zyMaster: ZyMaster = zymbolProgressionMaster;
  baseFrame: ZymbolFrame = new ZymbolFrame(0, this);
  children: Zym<any, any>[] = [this.baseFrame];

  component: FC = () => <div>What's up?</div>;

  persist() {
    return {};
  }

  hydrate(_persisted: any): void {}
}
