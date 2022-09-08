import { FC } from "react";
import {
  hydrateChild,
  safeHydrate,
} from "../../../../../../zym_lib/zym/utils/hydrate";
import { Zym } from "../../../../../../zym_lib/zym/zym";
import { useZymponent } from "../../../../../../zym_lib/zym/zymplementations/zyact/hooks";
import { Zyact } from "../../../../../../zym_lib/zym/zymplementations/zyact/zyact";
import { ZyMaster } from "../../../../../../zym_lib/zym/zy_master";
import { ZyPartialPersist } from "../../../../../../zym_lib/zy_schema/zy_schema";
import { STD_TRANSFORMER_TYPE_FILTERS } from "../../../zymbol_frame/transformer/std_transformers/std_transformer_type_filters";
import { ZymbolFrame } from "../../../zymbol_frame/zymbol_frame";
import {
  DisplayEquationPersistenceSchema,
  DisplayEquationSchema,
  DISPLAY_EQ_ID,
} from "./display_equation_schema";

class DisplayEquationMaster extends ZyMaster<
  DisplayEquationSchema,
  DisplayEquationPersistenceSchema
> {
  zyId: string = DISPLAY_EQ_ID;

  newBlankChild(): Zym<
    DisplayEquationSchema,
    DisplayEquationPersistenceSchema
  > {
    return new DisplayEquation(0, undefined);
  }
}

export const displayEquationMaster = new DisplayEquationMaster();

export class DisplayEquation extends Zyact<
  DisplayEquationSchema,
  DisplayEquationPersistenceSchema
> {
  zyMaster = displayEquationMaster;
  baseFrame: ZymbolFrame = new ZymbolFrame(0, this, {
    getTypeFilters: () => [STD_TRANSFORMER_TYPE_FILTERS.EQUATION],
  });
  children: Zym<any, any>[] = [this.baseFrame];

  component: React.FC = () => {
    const Frame = useZymponent(this.baseFrame);

    return (
      <div className="flex justify-center">
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
      ZyPartialPersist<DisplayEquationSchema, DisplayEquationPersistenceSchema>
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

  getCopyTex = () => {
    return `$$ ${this.baseFrame.baseZocket.renderTex({
      cursor: [],
      excludeHtmlIds: true,
      inlineTex: false,
    })} $$`;
  };
}
