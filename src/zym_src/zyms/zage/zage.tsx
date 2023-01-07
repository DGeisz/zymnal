import { useEffect } from "react";
import { hydrateChild, safeHydrate } from "../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../zym_lib/zym/zym";
import { useZymponent } from "../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { CursorIndex } from "../../../zym_lib/zy_god/cursor/cursor";
import { ZageSchema, ZAGE_ID } from "./zage_schema";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import { ZymbolModule } from "../zymbol_infrastructure/zymbol_module/zymbol_module";
import { ZymbolModuleSchema } from "../zymbol_infrastructure/zymbol_module/zymbol_module_schema";
import { enable } from "darkreader";

/* ==== MASTER ====  */
class ZageMaster extends ZyMaster<ZageSchema> {
  zyId = ZAGE_ID;

  newBlankChild() {
    return new Zage(0);
  }
}

export const zageMaster = new ZageMaster();

/* ==== ZYM ====  */

/* For the time being, a zage will just hold a central context */
export class Zage extends Zyact<ZageSchema> {
  zyMaster = zageMaster;

  module: ZymbolModule = new ZymbolModule(0, this);
  children = [this.module];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      module: "m",
    });
  }

  component = () => {
    const Module = useZymponent(this.module);

    useEffect(() => {
      enable({
        brightness: 100,
        contrast: 90,
        sepia: 10,
      });
    }, []);

    return (
      <div className="w-full flex justify-center">
        <div className="w-full max-w-3xl mt-16">
          <Module />
        </div>
      </div>
    );
  };

  persistData() {
    return {
      module: this.module.persist(),
    };
  }

  getRefreshedChildrenPointer(): Zym[] {
    return [this.module];
  }

  hydrateFromPartialPersist = async (
    p: Partial<ZyPartialPersist<ZageSchema>>
  ) => {
    await safeHydrate(p, {
      module: async (m) => {
        this.module = (await hydrateChild<ZymbolModuleSchema>(
          this,
          m
        )) as ZymbolModule;
      },
    });

    this.reConnectParentChildren();
  };
}

export const BASE_ZAGE = new Zage(0);

// @ts-ignore
window.zage = BASE_ZAGE;
