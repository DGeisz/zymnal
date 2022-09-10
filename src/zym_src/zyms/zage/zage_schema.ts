import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../zym_lib/zy_schema/zy_schema";
import { ZymbolModuleSchema } from "../zymbol_infrastructure/zymbol_module/zymbol_module_schema";

export type ZageSchema = CreateZySchema<
  {
    module: IdentifiedBaseSchema<ZymbolModuleSchema>;
  },
  {
    module: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<ZymbolModuleSchema>;
    };
  }
>;
