import { Cursor } from "../../../../../../zym_lib/zy_god/cursor/cursor";
import {
  CreateZySchema,
  IdentifiedBaseSchema,
  zyIdentifierFactory,
  ZymPersist,
} from "../../../../../../zym_lib/zy_schema/zy_schema";
import { ZymbolFrameSchema } from "../../../zymbol_frame/zymbol_frame_schema";
import { InlineInput } from "./inline_input";

export const INLINE_INPUT_ID = "inline-in";

export type InlineInputSchema = CreateZySchema<
  {
    inputFrame: IdentifiedBaseSchema<ZymbolFrameSchema>;
  },
  {
    inputFrame: {
      persistenceSymbol: "f";
      persistenceType: ZymPersist<ZymbolFrameSchema>;
    };
  }
>;

export const isInlineInput = zyIdentifierFactory<InlineInput>(INLINE_INPUT_ID);
