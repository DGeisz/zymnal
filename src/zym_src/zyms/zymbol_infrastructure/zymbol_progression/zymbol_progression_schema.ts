import {
  CreateZySchema,
  IdentifiedBaseSchema,
} from "../../../../zym_lib/zy_schema/zy_schema";

export const ZYMBOL_PROGRESSION_ID = "zymbol_progression";

export type ZymbolProgressionSchema = CreateZySchema<
  {
    baseFrame: IdentifiedBaseSchema<any>;
  },
  {
    baseFrame: {
      persistenceSymbol: "b";
      persistenceType: any;
    };
  }
>;
