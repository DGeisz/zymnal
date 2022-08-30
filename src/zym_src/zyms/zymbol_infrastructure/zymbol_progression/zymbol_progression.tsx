import {
  hydrateChild,
  safeHydrate,
} from "../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../zym_lib/zym/zym";
import { useZymponent } from "../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { CursorIndex } from "../../../../zym_lib/zy_god/cursor/cursor";
import { ZyPartialPersist } from "../../../../zym_lib/zy_schema/zy_schema";
import { ZymbolFrame } from "../zymbol_frame/zymbol_frame";
import {
  ZymbolProgressionPersistenceSchema,
  ZymbolProgressionSchema,
  ZYMBOL_PROGRESSION_ID,
} from "./zymbol_progression_schema";

class ZymbolProgressionMaster extends ZyMaster<
  ZymbolProgressionSchema,
  ZymbolProgressionPersistenceSchema,
  {}
> {
  zyId = ZYMBOL_PROGRESSION_ID;

  newBlankChild(): Zym<
    ZymbolProgressionSchema,
    ZymbolProgressionPersistenceSchema
  > {
    return new ZymbolProgression(0, undefined);
  }
}

export const zymbolProgressionMaster = new ZymbolProgressionMaster();

export class ZymbolProgression extends Zyact<
  ZymbolProgressionSchema,
  ZymbolProgressionPersistenceSchema
> {
  zyMaster = zymbolProgressionMaster;
  baseFrame: ZymbolFrame = new ZymbolFrame(0, this);
  children: Zym<any, any>[] = [this.baseFrame];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      baseFrame: "b",
    });
  }

  component: React.FC = () => {
    const Frame = useZymponent(this.baseFrame);

    return (
      <div className="w-full">
        <Frame />
      </div>
    );
  };

  persistData() {
    return {
      baseFrame: this.baseFrame.persist(),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<
      ZyPartialPersist<
        ZymbolProgressionSchema,
        ZymbolProgressionPersistenceSchema
      >
    >
  ): Promise<void> {
    await safeHydrate(p, {
      baseFrame: async (frame) => {
        this.baseFrame = (await hydrateChild(this, frame)) as ZymbolFrame;
      },
    });
    this.children = [this.baseFrame];

    this.reConnectParentChildren();
  }
}
