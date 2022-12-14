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
import { STD_TRANSFORMER_TYPE_FILTERS } from "../../../zymbol_frame/transformer/std_transformers/std_transformer_type_filters";
import { ZymbolFrame } from "../../../zymbol_frame/zymbol_frame";
import {
  DisplayEquationSchema,
  displayEquationTypeFilters,
  DISPLAY_EQ_ID,
} from "./display_equation_schema";

class DisplayEquationMaster extends ZyMaster<DisplayEquationSchema> {
  zyId: string = DISPLAY_EQ_ID;

  newBlankChild(): Zym<DisplayEquationSchema> {
    return new DisplayEquation(0, undefined);
  }
}

export const displayEquationMaster = new DisplayEquationMaster();

export class DisplayEquation extends Zyact<DisplayEquationSchema> {
  zyMaster = displayEquationMaster;
  baseFrame: ZymbolFrame = new ZymbolFrame(0, this, {
    getTypeFilters: displayEquationTypeFilters,
  });
  children: Zym<any, any>[] = [this.baseFrame];

  constructor(cursorIndex: CursorIndex, parent: Zym<any, any> | undefined) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      baseFrame: "b",
    });
  }

  component: React.FC = () => {
    const Frame = useZymponent(this.baseFrame);

    return (
      <div className="flex justify-center mt-4" contentEditable={false}>
        <Frame texClass="display-math" />
      </div>
    );
  };

  persistData() {
    return {
      baseFrame: this.baseFrame.persist(),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<DisplayEquationSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      baseFrame: async (frame) => {
        this.baseFrame = (await hydrateChild(this, frame)) as ZymbolFrame;
      },
    });
  }

  getRefreshedChildrenPointer(): Zym[] {
    return [this.baseFrame];
  }

  getCopyTex = () => {
    return `$$ ${this.baseFrame.baseZocket.renderTex({
      cursor: [],
      baseZocketRelativeCursor: [],
      excludeHtmlIds: true,
      inlineTex: false,
      copyTex: true,
    })} $$`;
  };
}
