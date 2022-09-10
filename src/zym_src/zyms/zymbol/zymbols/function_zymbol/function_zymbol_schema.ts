import {
  createZentinelMethodList,
  CreateZentinelMethodSchema,
} from "../../../../../zym_lib/hermes/hermes";
import {
  CreateZySchema,
  IdentifiedBaseSchema,
  ZymPersist,
} from "../../../../../zym_lib/zy_schema/zy_schema";
import { IdentifiedDotModifierZymbolTransformers } from "../../../zymbol_infrastructure/zymbol_frame/transformer/std_transformers/equation_transformers/dot_modifiers/dot_modifiers_schema";
import { TeX } from "../../zymbol_types";

export const FUNCTION_ZYMBOL_ID = "function-zymbol";

/* 
Mapping between the zocket index, and a boolean indicating
whether we should wrap it in brackets (instead of braces)
*/
export type FunctionBracketIndicator = Record<number, boolean>;

export type FunctionZymbolSchema = CreateZySchema<
  {
    children: IdentifiedBaseSchema<any>[];
    numZockets: number;
    bracketZockets: FunctionBracketIndicator;
    baseTex: TeX;
  },
  {
    children: {
      persistenceSymbol: "c";
      persistenceType: ZymPersist<any, any>[];
    };
    numZockets: "z";
    bracketZockets: "bz";
    baseTex: "b";
  }
>;

export type FunctionZymbolMethodSchema = CreateZentinelMethodSchema<{
  addDotModifierTransformer: {
    args: IdentifiedDotModifierZymbolTransformers;
    return: void;
  };
}>;

export const FunctionZymbolMethod =
  createZentinelMethodList<FunctionZymbolMethodSchema>(FUNCTION_ZYMBOL_ID, {
    addDotModifierTransformer: 0,
  });
