import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../zym_lib/zy_schema/zy_schema";
import {
  ZymbolContextPersistenceSchema,
  ZymbolContextSchema,
} from "../zymbol_infrastructure/zymbol_context/zymbol_context_schema";

export type ZageSchema = CreateZySchema<{
  // extends ZySchema {
  /* Replace this with the context schema */
  context: IdentifiedSchema<ZymbolContextSchema>;
}>;

export type ZagePersistenceSchema = CreatePersistenceSchema<
  ZageSchema,
  {
    context: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<
        ZymbolContextSchema,
        ZymbolContextPersistenceSchema
      >;
    };
  }
>;
