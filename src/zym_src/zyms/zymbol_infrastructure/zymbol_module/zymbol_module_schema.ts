import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../../zym_lib/hermes/hermes";
import { Cursor } from "../../../../zym_lib/zy_god/cursor/cursor";
import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../../zym_lib/zy_schema/zy_schema";
import { DerivationSchema } from "./module_lines/derivation/derivation_schema";
import { DisplayEquation } from "./module_lines/display_equation/display_equation";
import { DisplayEquationSchema } from "./module_lines/display_equation/display_equation_schema";
import { InlineInput } from "./module_lines/inline_input/inline_input";
import { InlineInputSchema } from "./module_lines/inline_input/inline_input_schema";

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
  handleLineFrontDelete: {
    args: JoinLinesArgs;
    return: void;
  };
  /* Puts a new inline inputs where the cursor currently is, moves the current
  line to the next line (for when user hits "Enter" at the beginning of a line with input) */
  addInlineBuffer: {
    args: { cursor: Cursor };
    return: void;
  };
  addLine: {
    args: { cursor: Cursor; lineType: ModuleLineType };
    return: void;
  };
}>;

export const ZymbolModuleMethod =
  createZentinelMethodList<ZymbolModuleMethodSchema>(ZYMBOL_MODULE_ID, {
    breakLine: 0,
    handleLineFrontDelete: 0,
    addLine: 0,
    addInlineBuffer: 0,
  });

export type ModuleLine = InlineInput | DisplayEquation;

export type ModuleLineSchema =
  | InlineInputSchema
  | DisplayEquationSchema
  | DerivationSchema;

export type ZymbolModuleSchema = CreateZySchema<
  {
    children: IdentifiedBaseSchema<ModuleLineSchema>;
  },
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: (
        | ZymPersist<DisplayEquationSchema>
        | ZymPersist<InlineInputSchema>
        | ZymPersist<DerivationSchema>
      )[];
    };
  }
>;
