import { useEffect } from "react";
import { hydrateChild, safeHydrate } from "../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../zym_lib/zym/zym";
import { useZymponent } from "../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../zym_lib/zym/zy_master";
import { ZymbolModule } from "../zymbol_infrastructure/zymbol_module/zymbol_module";
import { enable as enableDarkMode } from "darkreader";
import { CursorIndex } from "../../../zym_lib/zy_god/cursor/cursor";
import { ZagePersistenceSchema, ZageSchema } from "./zage_schema";
import { ZyPartialPersist } from "../../../zym_lib/zy_schema/zy_schema";
import {
  ZymbolModulePersistenceSchema,
  ZymbolModuleSchema,
} from "../zymbol_infrastructure/zymbol_module/zymbol_module_schema";
import Tex from "../../../global_building_blocks/tex/tex";
import {
  create_tex_text,
  CURSOR_LATEX,
} from "../../../global_utils/latex_utils";
import { zyMath } from "../../../global_building_blocks/tex/autoRender";
import { treatText } from "../zymbol/zymbols/text_zymbol/text_zymbol";

const DARK_MODE = true;

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

    // return (
    //   <div className="m-8">
    //     <Tex
    //       tex={`hij      ${zyMath("\\frac{1}{2}")} hi ${zyMath(
    //         CURSOR_LATEX
    //       )}$there as;ldkldkjasdfldkjasdf ldkjasdfldkjasdfldkjasdfldkjasdfldkjasdfldkjasdfldkjasdfl dkjasdfl dkjasdfldkjasdfldkjasdfjasdf`}
    //       inlineTex
    //     />

    //     {/* <Tex tex={"$$\\frac{1}{2}$$"} inlineTex /> */}
    //     {/* <Tex
    //       tex={treatText(
    //         `asd     asdf asdf a;skld ajsdf ;alskjdf as;ldf a;sldkfja s;ldk f;alskdjf ;aslkd ;asdlf;alsk df;laskd f;lkajsd f;laskjdf ;alksdjf asdf`,
    //         true
    //       )}
    //       inlineTex
    //     /> */}
    //     {/* <Tex tex={create_tex_text("Hello there")} /> */}
    //   </div>
    // );

    return (
      <div className="m-16">
        <BaseModuleComponent />
      </div>
    );
  };

  persistData() {
    return {
      module: this.baseZymbolModule.persist(),
    };
  }

  hydrateFromPartialPersist = async (
    p: Partial<ZyPartialPersist<ZageSchema, ZagePersistenceSchema>>
  ): Promise<void> => {
    await safeHydrate(p, {
      module: async (ctx) => {
        this.baseZymbolModule = (await hydrateChild<
          ZymbolModuleSchema,
          ZymbolModulePersistenceSchema
        >(this, ctx)) as ZymbolModule;
      },
    });
    this.children = [this.baseZymbolModule];

    this.reConnectParentChildren();
  };
}
