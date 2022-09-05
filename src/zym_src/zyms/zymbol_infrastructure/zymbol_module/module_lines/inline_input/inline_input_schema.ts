import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../../../zym_lib/zy_schema/zy_schema";
import {
  ZymbolFramePersistedSchema,
  ZymbolFrameSchema,
} from "../../../zymbol_frame/zymbol_frame_schema";

export const INLINE_INPUT_ID = "inline-in";

export type InlineInputSchema = CreateZySchema<{
  inputFrame: IdentifiedSchema<ZymbolFrameSchema>;
}>;

export type InlineInputPersistenceSchema = CreatePersistenceSchema<
  InlineInputSchema,
  {
    inputFrame: {
      persistenceSymbol: "f";
      persistenceType: ZymPersist<
        ZymbolFrameSchema,
        ZymbolFramePersistedSchema
      >;
    };
  }
>;
