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
import { ZymbolProgression } from "../zymbol_progression/zymbol_progression";
import {
  ZymbolContextPersistenceSchema,
  ZymbolContextSchema,
} from "./zymbol_context_schema";

class ZymbolContextMaster extends ZyMaster<
  ZymbolContextSchema,
  ZymbolContextPersistenceSchema,
  {}
> {
  zyId = "zymbol_context";

  newBlankChild(): Zym<ZymbolContextSchema, ZymbolContextPersistenceSchema> {
    return new ZymbolContext(0, undefined);
  }
}

export const zymbolContextMaster = new ZymbolContextMaster();

export class ZymbolContext extends Zyact<
  ZymbolContextSchema,
  ZymbolContextPersistenceSchema
> {
  zyMaster = zymbolContextMaster;
  progression: ZymbolProgression = new ZymbolProgression(0, this);
  children: Zym<any, any>[] = [this.progression];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      progression: "p",
    });
  }

  component: React.FC = () => {
    const ProgressionComponent = useZymponent(this.progression);

    return <ProgressionComponent />;
  };

  persistData() {
    return {
      progression: this.progression.persist(),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<
      ZyPartialPersist<ZymbolContextSchema, ZymbolContextPersistenceSchema>
    >
  ): Promise<void> {
    await safeHydrate(p, {
      progression: async (p) => {
        this.progression = (await hydrateChild(this, p)) as ZymbolProgression;
      },
    });

    this.children = [this.progression];

    this.reConnectParentChildren();
  }
}
