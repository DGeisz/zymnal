import {
  CreatePersistenceSchema,
  CreateZySchema,
  IdentifiedSchema,
  ZymPersist,
} from "../../../zym_lib/zy_schema/zy_schema";
import {
  ZymbolModulePersistenceSchema,
  ZymbolModuleSchema,
} from "../zymbol_infrastructure/zymbol_module/zymbol_module_schema";

export type ZageSchema = CreateZySchema<{
  module: IdentifiedSchema<ZymbolModuleSchema>;
}>;

export type ZagePersistenceSchema = CreatePersistenceSchema<
  ZageSchema,
  {
    module: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<
        ZymbolModuleSchema,
        ZymbolModulePersistenceSchema
      >;
    };
  }
>;
