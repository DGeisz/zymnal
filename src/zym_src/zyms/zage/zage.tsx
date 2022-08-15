import { useEffect } from "react";
import { hydrateChild, safeHydrate } from "../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../zym_lib/zym/zym";
import { useZymponent } from "../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { ZymbolContext } from "../zymbol_infrastructure/zymbol_context/zymbol_context";
import { enable as enableDarkMode } from "darkreader";
import { CursorIndex } from "../../../zym_lib/zy_god/cursor/cursor";
import { ZagePersistenceSchema, ZageSchema } from "./zage_schema";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import {
  ZymbolContextPersistenceSchema,
  ZymbolContextSchema,
} from "../zymbol_infrastructure/zymbol_context/zymbol_context_schema";

/* ==== MASTER ====  */
class ZageMaster extends ZyMaster<ZageSchema, ZagePersistenceSchema, {}> {
  zyId = "zage";

  newBlankChild(): Zym<ZageSchema, ZagePersistenceSchema> {
    return new Zage(0);
  }
}

export const zageMaster = new ZageMaster();

/* ==== ZYM ====  */

/* For the time being, a zage will just hold a central context */
export class Zage extends Zyact<ZageSchema, ZagePersistenceSchema> {
  zyMaster = zageMaster;
  baseZymbolContext: ZymbolContext = new ZymbolContext(0, this);
  children = [this.baseZymbolContext];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      context: "c",
    });
  }

  component = () => {
    const BaseContextComponent = useZymponent(this.baseZymbolContext);

    useEffect(() => {
      enableDarkMode({
        brightness: 100,
        contrast: 100,
        sepia: 10,
      });
    }, []);

    return (
      <div className="m-16">
        <BaseContextComponent />
      </div>
    );
  };

  persistData() {
    return {
      context: this.baseZymbolContext.persist(),
    };
  }

  hydrateFromPartialPersist = async (
    p: Partial<ZyPartialPersist<ZageSchema, ZagePersistenceSchema>>
  ): Promise<void> => {
    await safeHydrate(p, {
      context: async (ctx) => {
        this.baseZymbolContext = (await hydrateChild<
          ZymbolContextSchema,
          ZymbolContextPersistenceSchema
        >(this, ctx)) as ZymbolContext;
      },
    });
    this.children = [this.baseZymbolContext];

    this.reConnectParentChildren();
  };
}
