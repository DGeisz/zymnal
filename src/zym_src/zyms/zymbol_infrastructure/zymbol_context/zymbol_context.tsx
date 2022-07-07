import { FC } from "react";
import { Zym } from "../../../../zym_lib/zym/zym";
import { useZymponent } from "../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { ZymbolProgression } from "../zymbol_progression/zymbol_progression";
import { zymbolContextMaster } from "./zc_master";
import { ZCP_FIELDS, ZymbolContextPersist } from "./zc_persist";

export class ZymbolContext extends Zyact<ZymbolContextPersist> {
  zyMaster: ZyMaster = zymbolContextMaster;
  progression: ZymbolProgression = new ZymbolProgression(0, this);
  children: Zym<any, any>[] = [this.progression];

  component: FC = () => {
    const ProgressionComponent = useZymponent(this.progression);

    return <ProgressionComponent />;
  };

  persist() {
    return {
      [ZCP_FIELDS.PROGRESSION]: this.progression.persist(),
    };
  }

  hydrate(persisted: ZymbolContextPersist): void {
    this.progression.hydrate(persisted[ZCP_FIELDS.PROGRESSION]);
  }
}
