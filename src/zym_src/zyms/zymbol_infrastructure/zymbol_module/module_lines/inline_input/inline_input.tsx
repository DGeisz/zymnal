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
import { InlineInputSchema, INLINE_INPUT_ID } from "./inline_input_schema";

class InlineInputMaster extends ZyMaster<InlineInputSchema> {
  zyId: string = INLINE_INPUT_ID;

  newBlankChild() {
    return new InlineInput(0, undefined);
  }
}

export const inlineInputMaster = new InlineInputMaster();

export class InlineInput extends Zyact<InlineInputSchema> {
  zyMaster: ZyMaster = inlineInputMaster;
  inputFrame: ZymbolFrame = new ZymbolFrame(0, this, {
    inlineFrame: true,
    getTypeFilters: (cursor) => {
      return this.inputFrame.inlineTypeFilters(cursor);
    },
    inlineTex: true,
  });
  children = [this.inputFrame];

  constructor(cursorIndex: CursorIndex, parent?: Zym<any, any, any>) {
    super(cursorIndex, parent);

    this.setPersistenceSchemaSymbols({
      inputFrame: "f",
    });
  }

  component: React.FC = () => {
    const Frame = useZymponent(this.inputFrame);

    return <Frame />;
  };

  persistData() {
    return {
      inputFrame: this.inputFrame.persist(),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<ZyPartialPersist<InlineInputSchema>>
  ): Promise<void> {
    await safeHydrate(p, {
      inputFrame: async (frame) => {
        this.inputFrame = (await hydrateChild(this, frame)) as ZymbolFrame;
      },
    });
  }

  getRefreshedChildrenPointer(): Zym[] {
    return [this.inputFrame];
  }

  getCopyTex = () => {
    const baseTex = this.inputFrame.baseZocket
      .renderTex({
        cursor: [],
        excludeHtmlIds: true,
        inlineTex: true,
        copyTex: true,
      })
      .trim();

    if (baseTex) return baseTex;

    return "\\\\\\\\";
  };
}
