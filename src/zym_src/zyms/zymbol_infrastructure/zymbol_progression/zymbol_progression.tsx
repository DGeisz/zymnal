import { FC } from "react";
import { hydrateChild } from "../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../zym_lib/zym/zym";
import { useZymponent } from "../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { ZymbolFrame } from "../zymbol_frame/zymbol_frame";

const ZPP_FIELDS: { BASE_FRAME: "b" } = {
  BASE_FRAME: "b",
};

export interface ZymbolProgressionPersist {
  [ZPP_FIELDS.BASE_FRAME]: any;
}

export const ZYMBOL_PROGRESSION_ID = "zymbol_progression";

class ZymbolProgressionMaster extends ZyMaster {
  zyId = ZYMBOL_PROGRESSION_ID;

  newBlankChild(): Zym<any, any, any> {
    return new ZymbolProgression(0, undefined);
  }
}

export const zymbolProgressionMaster = new ZymbolProgressionMaster();

export class ZymbolProgression extends Zyact<ZymbolProgressionPersist> {
  zyMaster: ZyMaster = zymbolProgressionMaster;
  baseFrame: ZymbolFrame = new ZymbolFrame(0, this);
  children: Zym<any, any>[] = [this.baseFrame];

  component: FC = () => {
    const Frame = useZymponent(this.baseFrame);

    return (
      <div className="w-full">
        <Frame />
      </div>
    );
  };

  persistData(): ZymbolProgressionPersist {
    return {
      [ZPP_FIELDS.BASE_FRAME]: this.baseFrame.persist(),
    };
  }

  async hydrate(p: ZymbolProgressionPersist): Promise<void> {
    this.baseFrame = (await hydrateChild(
      this,
      p[ZPP_FIELDS.BASE_FRAME]
    )) as ZymbolFrame;
    this.children = [this.baseFrame];

    this.reConnectParentChildren();
  }
}
