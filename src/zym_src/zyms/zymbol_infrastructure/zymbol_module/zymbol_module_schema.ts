import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../../zym_lib/hermes/hermes";
import { Cursor } from "../../../../zym_lib/zy_god/cursor/cursor";
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
import { DisplayEquation } from "./module_lines/display_equation/display_equation";
import {
  DisplayEquationPersistenceSchema,
  DisplayEquationSchema,
} from "./module_lines/display_equation/display_equation_schema";
import { InlineInput } from "./module_lines/inline_input/inline_input";
import {
  InlineInputPersistenceSchema,
  InlineInputSchema,
} from "./module_lines/inline_input/inline_input_schema";

export const ZYMBOL_MODULE_ID = "zymbol-module";

export enum ModuleLineType {
  Inline,
  DisplayEquation,
}

interface BreakLineArgs {
  cursor: Cursor;
}

interface JoinLinesArgs {
  cursor: Cursor;
}

export type ZymbolModuleMethodSchema = CreateZentinelMethodSchema<{
  breakLine: {
    args: BreakLineArgs;
    return: void;
  };
  joinLine: {
    args: JoinLinesArgs;
    return: void;
  };
  addInlineLine: {
    args: { cursor: Cursor; lineType: ModuleLineType };
    return: void;
  };
}>;

export const ZymbolModuleMethod =
  createZentinelMethodList<ZymbolModuleMethodSchema>(ZYMBOL_MODULE_ID, {
    breakLine: 0,
    joinLine: 0,
    addInlineLine: 0,
  });

export type ModuleLine = InlineInput | DisplayEquation;

export type ModuleLineSchema =
  | InlineInputSchema
  | DisplayEquationSchema
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
        | ZymPersist<DisplayEquationSchema, DisplayEquationPersistenceSchema>
        | ZymPersist<InlineInputSchema, InlineInputPersistenceSchema>
        | ZymPersist<DerivationSchema, DerivationPersistenceSchema>
      )[];
    };
  }
>;
