import { zySome } from "../../../../../../zym_lib/utils/zy_option";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../../../zym_lib/zym/zym";
import { useZymponent } from "../../../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../../../zym_lib/zym/zy_master";
import { CursorIndex } from "../../../../../../zym_lib/zy_god/cursor/cursor";
import { CursorCommandTrait } from "../../../../../../zym_lib/zy_god/cursor/cursor_commands";
import { ZyPartialPersist } from "../../../../../../zym_lib/zy_schema/zy_schema";
import { Zinput } from "../../../../basic_building_blocks/zinput/zinput";
import {
  StandardInputPersistenceSchema,
  StandardInputSchema,
  STANDARD_INPUT_ID,
} from "./standard_input_schema";

class StandardInputMaster extends ZyMaster<
  StandardInputSchema,
  StandardInputPersistenceSchema
> {
  zyId: string = STANDARD_INPUT_ID;

  newBlankChild() {
    return new StandardInput(0, undefined);
  }
}

export const standardInputMaster = new StandardInputMaster();

export class StandardInput extends Zyact<
  StandardInputSchema,
  StandardInputPersistenceSchema
> {
  zyMaster: ZyMaster = standardInputMaster;
  zinput: Zinput = new Zinput(0, this);
  children = [this.zinput];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      zinput: "z",
    });
  }

  component: React.FC = () => {
    const Zinput = useZymponent(this.zinput);

    return (
      <div className="w-full">
        <Zinput />
      </div>
    );
  };

  persistData() {
    return {
      zinput: this.zinput.persist(),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<
      ZyPartialPersist<StandardInputSchema, StandardInputPersistenceSchema>
    >
  ): Promise<void> {
    await safeHydrate(p, {
      zinput: async (zinput) => {
        this.zinput = (await hydrateChild(this, zinput)) as Zinput;
      },
    });
  }
}

standardInputMaster.implementTrait(CursorCommandTrait, {
  async getInitialCursor() {
    return zySome([0]);
  },
});
