import { FC } from "react";
import { Zym } from "../../../../zym_lib/zym/zym";
import { useZymponent } from "../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { ZymbolFrame } from "../zymbol_frame/zymbol_frame";
import { zymbolProgressionMaster } from "./zp_master";
import { ZymbolProgressionPersist } from "./zp_persist";

export class ZymbolProgression extends Zyact<ZymbolProgressionPersist> {
  zyMaster: ZyMaster = zymbolProgressionMaster;
  baseFrame: ZymbolFrame = new ZymbolFrame(0, this);
  children: Zym<any, any>[] = [this.baseFrame];

  component: FC = () => {
    const ProgressionComponent = useZymponent(this.baseFrame);

    return <ProgressionComponent />;
  };

  persist() {
    return {};
  }

  hydrate(_persisted: any): void {}

  clone = () => {
    const newProgression = new ZymbolProgression(
      this.getCursorIndex(),
      this.parent
    );
    newProgression.baseFrame = this.baseFrame.clone() as ZymbolFrame;
    newProgression.children = [newProgression.baseFrame];

    return newProgression;
  };
}
