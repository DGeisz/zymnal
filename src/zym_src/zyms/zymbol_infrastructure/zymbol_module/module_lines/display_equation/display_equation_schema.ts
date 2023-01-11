import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../../../../zym_lib/zy_schema/zy_schema";
import { STD_TRANSFORMER_TYPE_FILTERS } from "../../../zymbol_frame/transformer/std_transformers/std_transformer_type_filters";
import { ZymbolFrameSchema } from "../../../zymbol_frame/zymbol_frame_schema";

export const DISPLAY_EQ_ID = "display-eq";

export type DisplayEquationSchema = CreateZySchema<
  {
    baseFrame: IdentifiedBaseSchema<ZymbolFrameSchema>;
  },
  {
    baseFrame: {
      persistenceSymbol: "b";
      persistenceType: ZymPersist<ZymbolFrameSchema>;
    };
  }
>;

export function displayEquationTypeFilters() {
  return [
    STD_TRANSFORMER_TYPE_FILTERS.EQUATION,
    STD_TRANSFORMER_TYPE_FILTERS.USE_SNIPPETS,
  ];
}
