import {
  hydrateChild,
  safeHydrate,
} from "../../../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../../../zym_lib/zym/zym";
import { useZymponent } from "../../../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../../../zym_lib/zym/zy_master";
import { CursorIndex } from "../../../../../../zym_lib/zy_god/cursor/cursor";
import { ZyPartialPersist } from "../../../../../../zym_lib/zy_schema/zy_schema";
import { ZymbolFrame } from "../../../zymbol_frame/zymbol_frame";
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
  frame: ZymbolFrame = new ZymbolFrame(0, this);
  children: Zym<any, any, any, any>[] = [this.frame];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      frame: "f",
    });
  }

  component: React.FC = () => {
    const Frame = useZymponent(this.frame);

    return (
      <div className="w-full">
        <Frame />
      </div>
    );
  };

  persistData() {
    return {
      frame: this.frame.persist(),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<
      ZyPartialPersist<StandardInputSchema, StandardInputPersistenceSchema>
    >
  ): Promise<void> {
    await safeHydrate(p, {
      frame: async (frame) => {
        this.frame = (await hydrateChild(this, frame)) as ZymbolFrame;
      },
    });
  }
}
