import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../../../../zym_lib/zy_schema/zy_schema";
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
