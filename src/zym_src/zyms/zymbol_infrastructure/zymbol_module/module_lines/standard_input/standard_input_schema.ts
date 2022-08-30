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

export const STANDARD_INPUT_ID = "standard-in";

export type StandardInputSchema = CreateZySchema<{
  frame: IdentifiedSchema<ZymbolFrameSchema>;
}>;

export type StandardInputPersistenceSchema = CreatePersistenceSchema<
  StandardInputSchema,
  {
    frame: {
      persistenceSymbol: "f";
      persistenceType: ZymPersist<
        ZymbolFrameSchema,
        ZymbolFramePersistedSchema
      >;
    };
  }
>;
