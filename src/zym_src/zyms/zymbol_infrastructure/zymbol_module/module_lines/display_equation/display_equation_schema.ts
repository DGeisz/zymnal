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

export const DISPLAY_EQ_ID = "display-eq";

export type DisplayEquationSchema = CreateZySchema<{
  baseFrame: IdentifiedSchema<ZymbolFrameSchema>;
}>;

export type DisplayEquationPersistenceSchema = CreatePersistenceSchema<
  DisplayEquationSchema,
  {
    baseFrame: {
      persistenceSymbol: "b";
      persistenceType: ZymPersist<
        ZymbolFrameSchema,
        ZymbolFramePersistedSchema
      >;
    };
  }
>;
