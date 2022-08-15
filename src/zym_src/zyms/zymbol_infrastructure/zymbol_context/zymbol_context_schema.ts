import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../../zym_lib/zy_schema/zy_schema";
import {
  ZymbolProgressionPersistenceSchema,
  ZymbolProgressionSchema,
} from "../zymbol_progression/zymbol_progression_schema";

export type ZymbolContextSchema = CreateZySchema<{
  progression: IdentifiedSchema<ZymbolProgressionSchema>;
}>;

export type ZymbolContextPersistenceSchema = CreatePersistenceSchema<
  ZymbolContextSchema,
  {
    progression: {
      persistenceSymbol: "p";
      persistenceType: ZymPersist<
        ZymbolProgressionSchema,
        ZymbolProgressionPersistenceSchema
      >;
    };
  }
>;
