import {
  hydrateChild,
  safeHydrate,
} from "../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../zym_lib/zym/zym";
import { useZymponents } from "../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../zym_lib/zym/zy_master";
import { CursorIndex } from "../../../../zym_lib/zy_god/cursor/cursor";
import { ZyPartialPersist } from "../../../../zym_lib/zy_schema/zy_schema";
import { ZymbolProgression } from "../zymbol_progression/zymbol_progression";
import { Derivation } from "./module_lines/derivation/derivation";
import { InlineInput } from "./module_lines/inline_input/inline_input";
import { StandaloneEquation } from "./module_lines/standalone_equation/standalone_equation";
import {
  ZymbolModulePersistenceSchema,
  ZymbolModuleSchema,
  ZYMBOL_MODULE_ID,
} from "./zymbol_module_schema";

class ZymbolModuleMaster extends ZyMaster<
  ZymbolModuleSchema,
  ZymbolModulePersistenceSchema,
  {}
> {
  zyId = ZYMBOL_MODULE_ID;

  newBlankChild(): Zym<ZymbolModuleSchema, ZymbolModulePersistenceSchema> {
    return new ZymbolModule(0, undefined);
  }
}

export const zymbolModuleMaster = new ZymbolModuleMaster();

export type ModuleLine =
  | StandaloneEquation
  | InlineInput
  | Derivation
  | ZymbolProgression;

export class ZymbolModule extends Zyact<
  ZymbolModuleSchema,
  ZymbolModulePersistenceSchema
> {
  zyMaster = zymbolModuleMaster;
  children: ModuleLine[];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    /* Start out with a single standard input as the first line */
    this.children = [new InlineInput(0, this)];
    // this.children = [new ZymbolProgression(0, this)];

    this.setPersistenceSchemaSymbols({
      children: "c",
    });
  }

  component: React.FC = () => {
    const ChildrenComponents = useZymponents(this.children);

    return (
      <>
        {ChildrenComponents.map((C, i) => (
          <C key={i} />
        ))}
      </>
    );
  };

  persistData() {
    return {
      children: this.children.map((c) => c.persist()),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<
      ZyPartialPersist<ZymbolModuleSchema, ZymbolModulePersistenceSchema>
    >
  ): Promise<void> {
    await safeHydrate(p, {
      children: async (children) => {
        this.children = (await Promise.all(
          children.map((c) => hydrateChild<any, any>(this, c))
        )) as ModuleLine[];
      },
    });

    this.reConnectParentChildren();
  }
}
