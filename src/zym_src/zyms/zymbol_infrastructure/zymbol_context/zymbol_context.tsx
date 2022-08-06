import { FC } from "react";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../zym_lib/zym/utils/hydrate";
import { Zym, ZymPersist } from "../../../../zym_lib/zym/zym";
import { useZymponent } from "../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import {
  ZymbolProgression,
  ZymbolProgressionPersist,
} from "../zymbol_progression/zymbol_progression";

export const ZCP_FIELDS: {
  PROGRESSION: "p";
} = {
  PROGRESSION: "p",
};

export interface ZymbolContextPersist {
  [ZCP_FIELDS.PROGRESSION]: ZymPersist<ZymbolProgressionPersist>;
}

class ZymbolContextMaster extends ZyMaster {
  zyId = "zymbol_context";

  newBlankChild(): Zym<any, any, any> {
    return new ZymbolContext(0, undefined);
  }
}

export const zymbolContextMaster = new ZymbolContextMaster();

export class ZymbolContext extends Zyact<ZymbolContextPersist> {
  zyMaster: ZyMaster = zymbolContextMaster;
  progression: ZymbolProgression = new ZymbolProgression(0, this);
  children: Zym<any, any>[] = [this.progression];

  component: FC = () => {
    const ProgressionComponent = useZymponent(this.progression);

    return <ProgressionComponent />;
  };

  persistData() {
    return {
      [ZCP_FIELDS.PROGRESSION]: this.progression.persist(),
    };
  }

  async hydrate(p: Partial<ZymbolContextPersist>): Promise<void> {
    await safeHydrate(p, {
      [ZCP_FIELDS.PROGRESSION]: async (p) => {
        this.progression = (await hydrateChild(this, p)) as ZymbolProgression;
      },
    });

    this.children = [this.progression];

    this.reConnectParentChildren();
  }
}
