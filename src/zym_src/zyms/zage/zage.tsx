import { useEffect } from "react";
import { hydrateChild, safeHydrate } from "../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../zym_lib/zym/zym";
import { useZymponent } from "../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { ZymbolModule } from "../zymbol_infrastructure/zymbol_module/zymbol_module";
import { enable as enableDarkMode } from "darkreader";
import { CursorIndex } from "../../../zym_lib/zy_god/cursor/cursor";
import { ZageSchema } from "./zage_schema";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import { ZymbolModuleSchema } from "../zymbol_infrastructure/zymbol_module/zymbol_module_schema";

const DARK_MODE = true;

/* ==== MASTER ====  */
class ZageMaster extends ZyMaster<ZageSchema> {
  zyId = "zage";

  newBlankChild() {
    return new Zage(0);
  }
}

export const zageMaster = new ZageMaster();

/* ==== ZYM ====  */

/* For the time being, a zage will just hold a central context */
export class Zage extends Zyact<ZageSchema> {
  zyMaster = zageMaster;
  baseZymbolModule: ZymbolModule = new ZymbolModule(0, this);
  children = [this.baseZymbolModule];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      module: "c",
    });
  }

  component = () => {
    const BaseModuleComponent = useZymponent(this.baseZymbolModule);

    useEffect(() => {
      DARK_MODE &&
        enableDarkMode({
          brightness: 100,
          contrast: 100,
          sepia: 10,
        });
    }, []);

    return (
      <div className="flex justify-center">
        <div className="flex-1 m-16 max-w-3xl">
          <BaseModuleComponent />
        </div>
      </div>
    );
  };

  persistData() {
    return {
      module: this.baseZymbolModule.persist(),
    };
  }

  hydrateFromPartialPersist = async (
    p: Partial<ZyPartialPersist<ZageSchema>>
  ): Promise<void> => {
    await safeHydrate(p, {
      module: async (ctx) => {
        this.baseZymbolModule = (await hydrateChild<ZymbolModuleSchema>(
          this,
          ctx
        )) as ZymbolModule;
      },
    });
    this.children = [this.baseZymbolModule];

    this.reConnectParentChildren();
  };
}
