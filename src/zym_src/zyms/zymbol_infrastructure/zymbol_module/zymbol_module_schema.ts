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
  InlineInputPersistenceSchema,
  InlineInputSchema,
} from "./module_lines/inline_input/inline_input_schema";
import {
  StandaloneEqSchema,
  StandalonePersistenceSchema,
} from "./module_lines/standalone_equation/standalone_equation_schema";

export const ZYMBOL_MODULE_ID = "zymbol-module";

export type ModuleLineSchema =
  | InlineInputSchema
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
        | ZymPersist<InlineInputSchema, InlineInputPersistenceSchema>
        | ZymPersist<DerivationSchema, DerivationPersistenceSchema>
        | ZymPersist<
            ZymbolProgressionSchema,
            ZymbolProgressionPersistenceSchema
          >
      )[];
    };
  }
>;
