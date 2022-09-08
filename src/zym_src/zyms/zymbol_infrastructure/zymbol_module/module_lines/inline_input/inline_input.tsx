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
import { isTextZymbol } from "../../../../zymbol/zymbols/text_zymbol/text_zymbol_schema";
import { STD_TRANSFORMER_TYPE_FILTERS } from "../../../zymbol_frame/transformer/std_transformers/std_transformer_type_filters";
import { ZymbolFrame } from "../../../zymbol_frame/zymbol_frame";
import {
  InlineInputPersistenceSchema,
  InlineInputSchema,
  INLINE_INPUT_ID,
} from "./inline_input_schema";

class InlineInputMaster extends ZyMaster<
  InlineInputSchema,
  InlineInputPersistenceSchema
> {
  zyId: string = INLINE_INPUT_ID;

  newBlankChild() {
    return new InlineInput(0, undefined);
  }
}

export const inlineInputMaster = new InlineInputMaster();

export class InlineInput extends Zyact<
  InlineInputSchema,
  InlineInputPersistenceSchema
> {
  zyMaster: ZyMaster = inlineInputMaster;
  inputFrame: ZymbolFrame = new ZymbolFrame(0, this, {
    inlineFrame: true,
    getTypeFilters: (cursor) => {
      const potentialText = this.inputFrame.baseZocket.children[cursor[1]];

      if (
        cursor.length <= 2 ||
        (!!potentialText && isTextZymbol(potentialText))
      ) {
        return [STD_TRANSFORMER_TYPE_FILTERS.INPUT];
      } else {
        return [STD_TRANSFORMER_TYPE_FILTERS.EQUATION];
      }
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

    return (
      // <div className="w-full m-4 p-4 shadow-xl rounded-md bg-red-100">
      <Frame />
      // </div>
    );
  };

  persistData() {
    return {
      inputFrame: this.inputFrame.persist(),
    };
  }

  async hydrateFromPartialPersist(
    p: Partial<
      ZyPartialPersist<InlineInputSchema, InlineInputPersistenceSchema>
    >
  ): Promise<void> {
    await safeHydrate(p, {
      inputFrame: async (frame) => {
        this.inputFrame = (await hydrateChild(this, frame)) as ZymbolFrame;
      },
    });
  }

  getCopyTex = () => {
    const baseTex = this.inputFrame.baseZocket
      .renderTex({
        cursor: [],
        excludeHtmlIds: true,
        inlineTex: true,
      })
      .trim();

    if (baseTex) return baseTex;

    return "\\\\";
  };
}
