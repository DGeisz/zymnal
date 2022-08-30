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
import {
  DerivationPersistenceSchema,
  DerivationSchema,
} from "./module_lines/derivation/derivation_schema";
import {
  StandaloneEqSchema,
  StandalonePersistenceSchema,
} from "./module_lines/standalone_equation/standalone_equation_schema";
import {
  StandardInputPersistenceSchema,
  StandardInputSchema,
} from "./module_lines/standard_input/standard_input_schema";

export const ZYMBOL_MODULE_ID = "zymbol-module";

export type ModuleLineSchema =
  | StandardInputSchema
  | StandaloneEqSchema
  | DerivationSchema;

export type ZymbolModuleSchema = CreateZySchema<{
  children: IdentifiedSchema<ModuleLineSchema>;
}>;

export type ZymbolModulePersistenceSchema = CreatePersistenceSchema<
  ZymbolModuleSchema,
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: (
        | ZymPersist<StandaloneEqSchema, StandalonePersistenceSchema>
        | ZymPersist<StandardInputSchema, StandardInputPersistenceSchema>
        | ZymPersist<DerivationSchema, DerivationPersistenceSchema>
        | ZymPersist<
            ZymbolProgressionSchema,
            ZymbolProgressionPersistenceSchema
          >
      )[];
    };
  }
>;
